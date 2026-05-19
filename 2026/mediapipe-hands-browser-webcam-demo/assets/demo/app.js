if (typeof Hands !== "function" || typeof ControlPanel !== "function") {
  throw new Error(
    "MediaPipe scripts did not load. Check the network and that this page is served over HTTPS or localhost.",
  );
}

const mpHands = window;
const drawingUtils = window;
const controls = window;
const controls3d = window;

function testSupport(supportedDevices) {
  const clientName =
    navigator.userAgentData?.brands?.[0]?.brand ?? navigator.userAgent;
  const osName = navigator.platform ?? "unknown";
  let isSupported = false;
  for (const device of supportedDevices) {
    if (device.client !== undefined && !new RegExp(device.client, "i").test(clientName)) {
      continue;
    }
    if (device.os !== undefined && !new RegExp(device.os, "i").test(osName)) {
      continue;
    }
    isSupported = true;
    break;
  }
  if (!isSupported) {
    console.warn(
      `MediaPipe Hands: ${clientName}/${osName} may be unsupported. Chrome desktop is recommended.`,
    );
  }
}

testSupport([{ client: "Chrome" }]);

const videoElement = document.querySelector(".input_video");
const canvasElement = document.querySelector(".output_canvas");
const controlsElement = document.querySelector(".control-panel");
const canvasCtx = canvasElement.getContext("2d");

const config = {
  locateFile: (file) =>
    `https://cdn.jsdelivr.net/npm/@mediapipe/hands@${mpHands.VERSION}/${file}`,
};

const fpsControl = new controls.FPS();

const spinner = document.querySelector(".loading");
spinner.ontransitionend = () => {
  spinner.style.display = "none";
};

const landmarkContainer = document.querySelector(".landmark-grid-container");
const grid = new controls3d.LandmarkGrid(landmarkContainer, {
  connectionColor: 0xcccccc,
  definedColors: [
    { name: "Left", value: 0xffa500 },
    { name: "Right", value: 0x00ffff },
  ],
  range: 0.2,
  fitToGrid: false,
  labelSuffix: "m",
  landmarkSize: 2,
  numCellsPerAxis: 4,
  showHidden: false,
  centered: false,
});

function onResults(results) {
  document.body.classList.add("loaded");
  fpsControl.tick();

  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  if (results.multiHandLandmarks && results.multiHandedness) {
    for (let index = 0; index < results.multiHandLandmarks.length; index++) {
      const classification = results.multiHandedness[index];
      const isRightHand = classification.label === "Right";
      const landmarks = results.multiHandLandmarks[index];
      drawingUtils.drawConnectors(canvasCtx, landmarks, mpHands.HAND_CONNECTIONS, {
        color: isRightHand ? "#00FF00" : "#FF0000",
      });
      drawingUtils.drawLandmarks(canvasCtx, landmarks, {
        color: isRightHand ? "#00FF00" : "#FF0000",
        fillColor: isRightHand ? "#FF0000" : "#00FF00",
        radius: (data) => drawingUtils.lerp(data.from?.z ?? 0, -0.15, 0.1, 10, 1),
      });
    }
  }
  canvasCtx.restore();

  if (results.multiHandWorldLandmarks && results.multiHandedness) {
    const landmarks = results.multiHandWorldLandmarks.reduce(
      (prev, current) => prev.concat(current),
      [],
    );
    const colors = [];
    let connections = [];
    for (let loop = 0; loop < results.multiHandWorldLandmarks.length; ++loop) {
      const offset = loop * mpHands.HAND_CONNECTIONS.length;
      const offsetConnections = mpHands.HAND_CONNECTIONS.map((connection) => [
        connection[0] + offset,
        connection[1] + offset,
      ]);
      connections = connections.concat(offsetConnections);
      const classification = results.multiHandedness[loop];
      colors.push({
        list: offsetConnections.map((_, i) => i + offset),
        color: classification.label,
      });
    }
    grid.updateLandmarks(landmarks, connections, colors);
  } else {
    grid.updateLandmarks([]);
  }
}

const hands = new mpHands.Hands(config);
hands.onResults(onResults);

new controls
  .ControlPanel(controlsElement, {
    selfieMode: true,
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  })
  .add([
    new controls.StaticText({ title: "MediaPipe Hands" }),
    fpsControl,
    new controls.Toggle({ title: "Selfie Mode", field: "selfieMode" }),
    new controls.SourcePicker({
      onFrame: async (input, size) => {
        const aspect = size.height / size.width;
        let width;
        let height;
        if (window.innerWidth > window.innerHeight) {
          height = window.innerHeight;
          width = height / aspect;
        } else {
          width = window.innerWidth;
          height = width * aspect;
        }
        canvasElement.width = width;
        canvasElement.height = height;
        await hands.send({ image: input });
      },
    }),
    new controls.Slider({
      title: "Max Number of Hands",
      field: "maxNumHands",
      range: [1, 4],
      step: 1,
    }),
    new controls.Slider({
      title: "Model Complexity",
      field: "modelComplexity",
      discrete: ["Lite", "Full"],
    }),
    new controls.Slider({
      title: "Min Detection Confidence",
      field: "minDetectionConfidence",
      range: [0, 1],
      step: 0.01,
    }),
    new controls.Slider({
      title: "Min Tracking Confidence",
      field: "minTrackingConfidence",
      range: [0, 1],
      step: 0.01,
    }),
  ])
  .on((options) => {
    videoElement.classList.toggle("selfie", options.selfieMode);
    hands.setOptions(options);
  });
