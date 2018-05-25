// @flow
// Copyright (c) 2016 Uber Technologies, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
// in compliance with the License. You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software distributed under the License
// is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
// or implied. See the License for the specific language governing permissions and limitations under
// the License.

/* tslint:disable */

import {types}  from '@opencensus/opencensus-core';

export type Tag = {
  key: string,
  value: any,
};

export type LogData = {
  timestamp: number,
  fields: Array<Tag>,
};

export type Process = {
  serviceName: string,
  tags: Array<Tag>,
  // N.B. uuid uniquely identifies this instance of the client. This variable is not defined
  // in the jaeger thrift process; it is only used inside this code base to facilitate passing
  // the uuid around to different objects. The uuid will be propagated via process tags, not
  // as a first class citizen of thrift process.
  uuid?: string,
};

export type Batch = {
  process: Process,
  spans: Array<any>,
};

export type Reference = {
  type(): string,
  referencedContext(): types.SpanContext,
};
