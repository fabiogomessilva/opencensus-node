/**
 * Copyright 2018, OpenCensus Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {types} from '@opencensus/opencensus-core';
import {classes} from '@opencensus/opencensus-core';
import {logger} from '@opencensus/opencensus-core';
import * as assert from 'assert';
import * as fs from 'fs';
import * as mocha from 'mocha';
import * as nock from 'nock';

import {JaegerTraceExporter, JaegerTraceExporterOptions} from '../src/';


process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';


function checkEnvironoment(): boolean {
  return false;
}

describe('Jeager Exporter', function() {
  this.timeout(0);

  const testLogger = logger.logger("debug");
  let dryrun = false;
  let exporterOptions: JaegerTraceExporterOptions;
  let exporter: JaegerTraceExporter;
  let tracer: classes.Tracer;


  before(() => {
  
    if (dryrun) {
      nock.disableNetConnect();
    }
    testLogger.debug('dryrun=%s', dryrun);
    exporterOptions = {
      serviceName: 'opencensus-exporter-trace-jaeger',
      tags: [ {
        key: 'my-awesome-service.version', value: '1.1.2' }],
      bufferTimeout: 200,
      logger: testLogger,
      maxPacketSize: 700
    } as JaegerTraceExporterOptions;
  });

  beforeEach(() => {
    exporter = new JaegerTraceExporter(exporterOptions);
    tracer = new classes.Tracer();
    tracer.start({samplingRate: 1});
    tracer.registerEndSpanListener(exporter);
  });


  /* Should add spans to an exporter buffer */
  describe('onEndSpan()', () => {
    it('should add a root span to an exporter buffer', () => {
      const rootSpanOptions = {name: 'root-S01'};
      return tracer.startRootSpan(rootSpanOptions, (rootSpan) => {
        assert.strictEqual(exporter.exporterBuffer.getQueue().length, 0);

        const spanName = 'child-S01';
        const span = tracer.startChildSpan(spanName);
        span.end();
        rootSpan.end();

        assert.strictEqual(exporter.exporterBuffer.getQueue().length, 1);
        assert.strictEqual(
            exporter.exporterBuffer.getQueue()[0].name, rootSpanOptions.name);
        assert.strictEqual(
            exporter.exporterBuffer.getQueue()[0].spans.length, 1);
        assert.strictEqual(
            exporter.exporterBuffer.getQueue()[0].spans[0].name, spanName);
      });
    });
  });

  /* Should export spans to stackdriver */
  describe('publish()', () => {
  
    it('should export traces to Jeager', (done) => {

      return tracer.startRootSpan(
          {name: 'root-s02'}, async (rootSpan) => {
            const span = tracer.startChildSpan('child-s02');
            span.end();
            rootSpan.end();

             exporter.publish([rootSpan]);//.then((result: string) => {
             // assert.ok(result.indexOf('sendTrace sucessfully') >= 0);
           // });
            done();
            return;
          });
    });
  });

});
