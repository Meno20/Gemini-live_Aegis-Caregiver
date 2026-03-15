// public/worklets/pcm-recorder-processor.js
class PCMRecorderProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input && input.length > 0) {
      // Send the first channel (mono) to the main thread
      const inputChannel = input[0];
      // We must copy the data because the browser reuses the heap for inputs
      const result = new Float32Array(inputChannel.length);
      result.set(inputChannel);
      this.port.postMessage(result);
    }
    return true;
  }
}

registerProcessor('pcm-recorder-processor', PCMRecorderProcessor);
