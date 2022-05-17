/**
 * @license Copyright 2016 The Lighthouse Authors. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const makeComputedArtifact = require('./computed-artifact.js');
const speedline = require('speedline-core');
const LHError = require('../lib/lh-error.js');
const ProcessedTrace = require('./processed-trace.js');

class Speedline {
  /**
   * @param {LH.Trace} trace
   * @param {LH.Artifacts.ComputedContext} context
   * @return {Promise<LH.Artifacts.Speedline>}
   */
  static async compute_(trace, context) {
    let speedline0;

    try {
      const processedTrace = await ProcessedTrace.request(trace, context);
      // Use a shallow copy of traceEvents so speedline can sort as it pleases.
      // See https://github.com/GoogleChrome/lighthouse/issues/2333
      const traceEvents = trace.traceEvents.slice();
      // Force use of timeOrigin as reference point for speedline
      // See https://github.com/GoogleChrome/lighthouse/issues/2095
      const timeOrigin = processedTrace.timestamps.timeOrigin;

      speedline0 = await speedline(traceEvents, {
        timeOrigin,
        fastMode: true,
        include: 'speedIndex',
      });
    } catch (err) {
      if (/No screenshots found in trace/.test(err.message)) {
        throw new LHError(LHError.errors.NO_SCREENSHOTS);
      }

      throw err;
    }

    if (speedline0.frames.length === 0) {
      throw new LHError(LHError.errors.NO_SPEEDLINE_FRAMES);
    }

    if (speedline0.speedIndex === 0) {
      throw new LHError(LHError.errors.SPEEDINDEX_OF_ZERO);
    }

    // speedline() may throw without a promise, so we resolve immediately
    // to get in a promise chain.
    return speedline0;
  }
}

module.exports = makeComputedArtifact(Speedline, null);
