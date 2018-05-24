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

import {classes, logger, types} from '@opencensus/opencensus-core';
import ThriftUtils from './jaeger-driver/thrift';
import UDPSender from './jaeger-driver/udp_sender'; 
import {Tag, Process} from './jaeger-driver/jaeger-thrift';

import RemoteReporter from './jaeger-driver/remote_reporter';

/**
 * Options for stackdriver configuration
 */
export interface JaegerTraceExporterOptions extends types.ExporterConfig {
  serviceName: string;
  tags?: Array<Tag>;
  host?: string;
  port?: number;
  maxPacketSize?: number;

  // N.B. uuid uniquely identifies this instance of the client. This variable is not defined
  // in the jaeger thrift process; it is only used inside this code base to facilitate passing
  // the uuid around to different objects. The uuid will be propagated via process tags, not
  // as a first class citizen of thrift process.
  uuid?: string
}


/** Format and sends span information to Stackdriver */
export class JaegerTraceExporter implements types.Exporter {
  process: Process;
  exporterBuffer: classes.ExporterBuffer;
  logger: types.Logger;
  failBuffer: types.SpanContext[] = [];
  sender: UDPSender;

  reporter: RemoteReporter;
  intervalHandle: any;

  constructor(options: JaegerTraceExporterOptions) {
    this.logger = options.logger || logger.logger('debug');
    this.exporterBuffer = new classes.ExporterBuffer(this, options);
    this.sender = new UDPSender(options);
    this.process = {
      serviceName: options.serviceName,
      tags: options.tags?ThriftUtils.getThriftTags(options.tags):[],
    };
    this.sender.setProcess(this.process);
    
  // this.reporter = new RemoteReporter(this.sender, options);
  // this.reporter.setProcess(this.process.serviceName, this.process.tags);

  //this.intervalHandle = setInterval(() => {
  //  this.flush();
  //}, options.bufferTimeout);
  }

  /**
   * Is called whenever a span is ended.
   * @param root the ended span
   */
  onEndSpan(root: types.RootSpan) {
    this.exporterBuffer.addToBuffer(root);
  }

  /**
   * Publishes a list of root spans to Stackdriver.
   * @param rootSpans
   */
  publish(rootSpans: types.RootSpan[]) {
   /* const spans = rootSpans.map(root => this.translateTrace(root));
    const logger = this.logger;

      for (const span of spans) {
        console.log('---- %o', span);
        this.sender.append(span, (numSpans: number, err?: string) => {
       // this.sender.append(span, (numSpans: number, err?: string) => {
          if (err) {
            logger.error(`Failed to append spans: ${err}`);
          } else {
            logger.debug('Sucefful for : %s', numSpans);          
          }
        });
      }*/
      
  /*    for (const root of rootSpans) {
        console.log('root: %s',root.name) 
        this.reporter.report(root);
        for (const span of root.spans) {   
          console.log('child: %s',span.name) 
          this.reporter.report(span);
        }
      } */

      for (const root of rootSpans) {
        console.log('root: %s',root.name) 
        this.report(root);
        for (const span of root.spans) {   
          console.log('child: %s',span.name) 
          this.report(span);
        }
      }       
      //  return new Promise((resolve, reject) => {});
  }

  report(span: types.Span): void {
    const thriftSpan = ThriftUtils.spanToThrift(span);
    console.log('---- %o', thriftSpan);
    this.sender.append(thriftSpan, (numSpans: number, err?: string) => {
      // this.sender.append(span, (numSpans: number, err?: string) => {
         if (err) {
           this.logger.error(`Failed to append spans: ${err}`);
         } else {
           this.logger.debug('Sucefull for : %s', numSpans);          
         }
       });
  }


  flush(callback?: () => void): void {
    /* if (this._process === undefined) {
       this._logger.error('Failed to flush since process is not set.');
       this._invokeCallback(callback);
       return;
     }*/
     this.sender.flush((numSpans: number, err?: string) => {
       if (err) {
         this.logger.error(`Failed to flush spans: ${err}`);
       } else {
        this.logger.debug('Sucefull for : %s', numSpans); 
       }
       if (callback) {
        callback();
      }
     });
   }
  /**
   * Translates root span data to Stackdriver's trace format.
   * @param root
   */
  private translateTrace(root: types.RootSpan) {
    const spanList = [];
    spanList.push(this.translateSpan(root));
   // spanList.concat(root.spans.map(span => this.translateSpan(span)));
    return spanList;
  }

  /**
   * Translates span data to Stackdriver's span format.
   * @param span
   */
  private translateSpan(span: types.Span) {
    const spanThrift = ThriftUtils.spanToThrift(span);
  //  this.logger.debug('translate spanThrift: %o', spanThrift);
    return spanThrift;
  }

}