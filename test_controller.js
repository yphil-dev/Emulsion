// import pkg from 'sdl2-gamecontroller';
// const { on, rumble, rumbleTriggers, enableGyroscope, enableAccelerometer, setLeds } = pkg;

// on("error", (data) => console.log("error", data));
// on("warning", (data) => console.log("warning", data));
// on("sdl-init", () => console.log("SDL2 Initialized"));

// // controller connected
// on("controller-device-added", (data) =>
//   console.log("controller connected", data)
// );

// // Rumble (if supported) when A button is pressed
// on("a:down", (data) => {
//   console.log(`player ${data.player} pressed A`);
//   rumble(60000, 40000, 100, data.player);
// });

// // Rumble triggers (if supported) when B button is pressed
// on("b:down", (data) => {
//   console.log(`player ${data.player} pressed B`);
//   rumbleTriggers(40000, 40000, 100, data.player);
// });

// // Enable Gyroscope (if supported) when X button is pressed
// on("x:down", (data) => {
//   console.log(`player ${data.player} pressed X`);
//   enableGyroscope(true);
// });

// // Disable Gyroscope (if supported) when X button is released
// on("x:up", (data) => {
//   console.log(`player ${data.player} released X`);
//   enableGyroscope(false);
// });

// // Enable Accelerometer (if supported) when Y button is pressed
// on("y:down", (data) => {
//   console.log(`player ${data.player} pressed Y`);
//   enableAccelerometer(true, data.player);
// });

// // Disable Accelerometer (if supported) when Y button is released
// on("y:up", (data) => {
//   console.log(`player ${data.player} released Y`);
//   enableAccelerometer(false, data.player);
// });

// // Set LED colors (if supported) when leftstick button is pressed
// var count = 0;
// on("leftstick:down", (data) => {
//   console.log(`player ${data.player} pressed leftstick`);
//   switch (count % 3) {
//     case 0:
//       setLeds(0x0f, 0x62, 0xfe, data.player);
//       break;
//     case 1:
//       setLeds(0x19, 0x80, 0x38, data.player);
//       break;
//     case 2:
//       setLeds(0x8a, 0x3f, 0xfc, data.player);
//       break;
//   }
//   count += 1;
// });

// // Axis motion
// on("controller-axis-motion", (data) =>
//   console.log("axis motion", data)
// );

// // Sensor updated
// on("controller-sensor-update", (data) =>
//   console.log("sensor update", data)
// );

// // Respond to both up & down events
// on("leftshoulder", (data) =>
//   console.log(`player ${data.player} pressed:${data.pressed} leftshoulder`)
// );

// // Print information about a pressed button
// on("controller-button-down", (data) =>
//   console.log("button pressed", data)
// );
