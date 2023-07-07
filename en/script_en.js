let recordButton = null;
let stopButton = null;
let submitButton = null;
let redoButton = null;
let nextButton = null;
let data_view_L = null;
let data_view_R = null;
let data_view_LR = null;

(async () => {
  let leftchannel = [];
  let rightchannel = [];
  let recording = false;
  let recordingLength = 0;
  let dataLength = 0;
  let volume = null;
  let audioInput = null;
  let sampleRate = null;
  let AudioContext = window.AudioContext || window.webkitAudioContext;
  let context = null;
  let analyser = null;
  let canvas = document.querySelector("canvas");
  let canvasCtx = canvas.getContext("2d");
  let visualSelect = document.querySelector("#visSelect");
  let micSelect = document.querySelector("#micSelect");
  let stream = null;
  let tested = false;
  let new_sampleRate = 44100;
  let min_duration = 270;
  let HP_filter = false;
  let delay = 0;

  // audio recorder
  recordButton = document.getElementById("record");
  recordButton.addEventListener("click", start);

  // stop recording
  stopButton = document.getElementById("stop");
  stopButton.addEventListener("click", stop);

  // redo recording
  const redoButton = document.getElementById("redo");
  redoButton.addEventListener("click", function () {
    if (confirm("Are you sure you want to redo the recording?")) {
      redo();
    }
  });
  // next
  nextButton = document.getElementById("next");
  nextButton.addEventListener("click", next);

  // submit recording
  submitButton = document.getElementById("submit");
  submitButton.addEventListener("click", submit);

//   try {
//     window.stream = stream = await getStream();
//     console.log("Got stream");
//   } catch (err) {
//     alert(
//       "There is something wrong with your microphone!\n\n Please check your microphone setting.",
//       err
//     );
//     $("#MAIN").addClass("hidden");
//     //document.querySelector("h1").innerText = "Sorry, your browser is not supported!\n For the best experience, please use any of these supported browsers:\n Firefox, Safari, QQ or WeChat.";
//     alert(
//       "Sorry, your browser is not supported!\n For the best experience, please use any of these supported browsers:\n Chrome, Firefox, Safari, QQ or WeChat."
//     );
//     location.replace("https://" + window.location.hostname);
//   }

  const deviceInfos = await navigator.mediaDevices.enumerateDevices();

  var mics = [];
  for (let i = 0; i !== deviceInfos.length; ++i) {
    let deviceInfo = deviceInfos[i];
    if (deviceInfo.kind === "audioinput") {
      mics.push(deviceInfo);
      let label = deviceInfo.label || "Microphone " + mics.length;
      console.log("Mic ", label + " " + deviceInfo.deviceId);
      const option = document.createElement("option");
      option.value = deviceInfo.deviceId;
      option.text = label;
      micSelect.appendChild(option);
    }
  }

  function getStream(constraints) {
    if (!constraints) {
      constraints = { audio: true, video: false };
    }
    return navigator.mediaDevices.getUserMedia(constraints);
  }

  function setUpRecording() {
    context = new AudioContext();
    sampleRate = context.sampleRate;

    // creates a gain node
    volume = context.createGain();

    // creates an audio node from teh microphone incoming stream
    audioInput = context.createMediaStreamSource(stream);

    // Create analyser
    analyser = context.createAnalyser();

    // connect audio input to the analyser
    audioInput.connect(analyser);

    // connect analyser to the volume control
    // analyser.connect(volume);

    let bufferSize = 4096;
    let recorder = context.createScriptProcessor(bufferSize, 2, 2);

    // we connect the volume control to the processor
    // volume.connect(recorder);

    analyser.connect(recorder);

    // finally connect the processor to the output
    recorder.connect(context.destination);

    recorder.onaudioprocess = function (e) {
      // Check
      if (!recording) return;
      // Do something with the data, i.e Convert this to WAV

      let left = e.inputBuffer.getChannelData(0);
      let right = e.inputBuffer.getChannelData(1);

      if (!tested) {
        tested = true;
        // if this reduces to 0 we are not getting any sound
        if (!left.reduce((a, b) => a + b)) {
          alert(
            "There is something wrong with your microphone!\n\nPlease check your microphone setting."
          );
          // clean up;
          // stop();
          stream.getTracks().forEach(function (track) {
            track.stop();
          });
          context.close();
          $("#MAIN").addClass("hidden");
          //document.querySelector("h1").innerText = "Your microphone is muted in the browser settings!\nPlease copy the below link and open it with other browsers\nFirefox, Safari, QQ or WeChat.\n-------------------\n\n https://voiceforhealth.online";
          alert("Your microphone is muted in the browser settings!");
          location.replace("https://" + window.location.hostname);
        }
      }

      if (HP_filter) {
        // we clone the samples
        leftchannel.push(new Float64Array(left));
        // rightchannel.push(new Float64Array(right));
        recordingLength += bufferSize;
        dataLength += bufferSize;
        duration_p = parseInt((dataLength / 48000 / min_duration) * 100);

        document.getElementById("p_bar").style.width = duration_p + "%";
        document.getElementById("p_percent").innerHTML = duration_p + "%";
        delay = 0;

        if (duration_p >= 100) {
          stop();
        }
      } else {
        if (parseInt(delay / 48000) <= 0.5) {
          left.forEach((elem, i) => {
            left[i] = 0;
          });
          leftchannel.push(new Float64Array(left));
          recordingLength += bufferSize;
        }
        delay += bufferSize;
      }
    };
    visualize();
  }

  // Visualizer function from
  // https://webaudiodemos.appspot.com/AudioRecorder/index.html
  //
  function visualize() {
    WIDTH = canvas.width;
    HEIGHT = canvas.height;
    CENTERX = canvas.width / 2;
    CENTERY = canvas.height / 2;

    if (!analyser) return;

    analyser.fftSize = 4096;
    var bufferLengthAlt = analyser.frequencyBinCount;
    // console.log(bufferLengthAlt);
    var dataArrayAlt = new Uint8Array(bufferLengthAlt);

    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

    var drawAlt = function () {
      drawVisual = requestAnimationFrame(drawAlt);
      analyser.getByteFrequencyData(dataArrayAlt);
      canvasCtx.fillStyle = "rgb(0, 0, 0)";
      canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

      var barWidth = WIDTH / bufferLengthAlt;
      var barHeight;
      var x = 0;

      if (Math.abs(dataArrayAlt.reduce((a, b) => a + b)) > 7500) {
        HP_filter = true;
      } else {
        HP_filter = false;
      }

      for (var i = 0; i < bufferLengthAlt; i++) {
        barHeight = dataArrayAlt[i];

        canvasCtx.fillStyle =
          "hsl( " + Math.round((i * 360) / bufferLengthAlt) + ", 100%, 50%)";
        canvasCtx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };
    drawAlt();
  }

  function start() {
    alert(
      " Attention：\n- Be sure to find a quiet space and turn off the fan/air conditioner.\n- Put your phone on silent mode.\n- The reading script is designed to provide understanding and a guide to collecting your voice.\n- You can just read it aloud at a normal speed until the progress bar reaches 100%."
    );
    setUpRecording();
    recordButton.disabled = true;
    recordButton.innerHTML =
      'Recording in Progress <i class="fa fa-spinner fa-spin"></i>';
    // $("#record").addClass("button-animate");

    $("#stop").removeClass("hidden");
    stopButton.disabled = false;

    $("#analyser").removeClass("hidden");
    $("#progress").removeClass("hidden");

    if (!$("#audio").hasClass("hidden")) {
      $("#audio").addClass("hidden");
    }

    if (!$("#submit").hasClass("hidden")) {
      $("#submit").addClass("hidden");
    }

    const element = document.getElementById("record");
    element.scrollIntoView(true);
    recording = true;

    // reset the buffers for the new recording
    // leftchannel.length = rightchannel.length = 0;
    leftchannel.length = 0;
    recordingLength = 0;
    if (!context) setUpRecording();
  }

  function stop() {
    $("#record").addClass("hidden");
    stopButton.disabled = true;
    stopButton.innerHTML =
      'Processing... <i class="fa fa-spinner fa-spin"></i>';
    $("#script").addClass("hidden");
    $("#analyser").addClass("hidden");
    $("#progress").addClass("hidden");
    //$("#transbox_1").removeClass("hidden");
    recording = false;

    setTimeout(function () {
      // we flat the left and right channels down
      let leftBuffer = mergeBuffers(leftchannel, recordingLength);
      // let rightBuffer = mergeBuffers(rightchannel, recordingLength);
      // we interleave both channels together
      // let interleaved = interleave(leftBuffer, rightBuffer);

      data_view_L = exportWAV(leftBuffer, 0.65);
      // data_view_R = exportWAV(rightBuffer, 1)
      // data_view_LR = exportWAV(interleaved, 1)
      // our final binary blob
      const blob = new Blob([data_view_L], { type: "audio/wav" });
      const audioUrl = URL.createObjectURL(blob);
      document.querySelector("#audio").setAttribute("src", audioUrl);

      console.log("Stop");
      $("#stop").addClass("hidden");
      $("#audio").removeClass("hidden");
      stopButton.innerHTML =
        'Stop Recording <i class="fas fa-microphone-slash"></i>';
      $("#redo").removeClass("hidden");
      $("#next").removeClass("hidden");
      //$("#transbox_1").addClass("hidden");
      document.getElementById("next").scrollIntoView(true);
    }, 500);

    var duration = parseInt(recordingLength / 48000);
    if (duration < min_duration) {
      alert(
        "Your recording duration too short. Please redo recording.\n\nRead the script aloud at a normal speed until the progress bar reaches 100%."
      );
      redo();
    }
  }

  function redo() {
    window.location.reload();
  }

  function next() {
    $("#next").addClass("hidden");
    $("#submit").removeClass("hidden");
    submitButton.disabled = false;
    $("#main-block").removeClass("hidden");
    document.getElementById("name").scrollIntoView(true);
  }

  function mergeBuffers(channelBuffer, recordingLength) {
    let result = new Float64Array(recordingLength);
    let offset = 0;
    let lng = channelBuffer.length;
    for (let i = 0; i < lng; i++) {
      let buffer = channelBuffer[i];
      result.set(buffer, offset);
      offset += buffer.length;
    }
    var newSamples = waveResampler.resample(result, sampleRate, new_sampleRate);
    return newSamples;
  }

  function exportWAV(dataBuffer, gain) {
    ///////////// WAV Encode /////////////////
    let buffer = new ArrayBuffer(44 + dataBuffer.length * 2);
    let view = new DataView(buffer);

    // RIFF chunk descriptor
    writeUTFBytes(view, 0, "RIFF");
    view.setUint32(4, 36 + dataBuffer.length * 2, true);
    writeUTFBytes(view, 8, "WAVE");
    // FMT sub-chunk
    writeUTFBytes(view, 12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, new_sampleRate, true);
    view.setUint32(28, new_sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    // data sub-chunk
    writeUTFBytes(view, 36, "data");
    view.setUint32(40, dataBuffer.length * 2, true);

    // write the PCM samples
    let lng = dataBuffer.length;
    let index = 44;
    let volume = gain;
    for (let i = 0; i < lng; i++) {
      view.setInt16(index, dataBuffer[i] * (0x7fff * volume), true);
      index += 2;
    }

    // for (var i = 0; i < lng; i++, index+=2){
    //   var s = Math.max(-1, Math.min(1, dataBuffer[i]));
    //   view.setInt16(index, s < 0 ? s * 0x8000 : s * (0x7FFF * volume), true);
    // }
    return view;
  }

  function interleave(leftChannel, rightChannel) {
    let length = (leftChannel.length + rightChannel.length) / 2;
    let result = new Float64Array(length);

    for (let index = 0; index < length; index++) {
      result[index++] = (leftChannel[index] + rightChannel[index]) / 2;
    }

    var newSamples = waveResampler.resample(result, sampleRate, new_sampleRate);

    return newSamples;
  }

  function writeUTFBytes(view, offset, string) {
    let lng = string.length;
    for (let i = 0; i < lng; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  function submit() {
    var name = document.getElementById("name").value.length;
    var email = document.getElementById("email").value.length;
    var mobile = document.getElementById("mobile").value.length;
    var dob = document.getElementById("dob").value.length;
    var male = document.getElementById("male").checked;
    var female = document.getElementById("female").checked;
    var med_yes = document.getElementById("med_yes").checked;
    var med_no = document.getElementById("med_no").checked;
    var v_email = ValidateEmail(document.getElementById("email").value.trim());
    var v_mobile = phonenumber(document.getElementById("mobile").value.trim());
    var v_dob = ValidateDOB(document.getElementById("dob").value.trim());
    var duration = parseInt(recordingLength / 48000);

    if (
      name > 0 &&
      v_email &&
      v_mobile &&
      v_dob &&
      (male || female) &&
      (med_yes || med_no) &&
      duration >= min_duration
    ) {
      submitButton.disabled = true;
      submitButton.innerHTML =
        'Uploading <i class="fa fa-spinner fa-spin"></i>';
      $("#redo").addClass("hidden");
      $("#audio").addClass("hidden");
      $("#transbox_2").removeClass("hidden");

      var timestamp = new Date();
      var date = timestamp.toISOString().slice(0, 10).trim();
      var time = timestamp
        .toLocaleString(
          "en-US",
          { hour12: false },
          { timeZone: "Asia/Kuala_Lumpur" }
        )
        .split(",")[1]
        .trim();
      var name = document.getElementById("name").value;
      var email = document.getElementById("email").value.trim();
      var mobile = document.getElementById("mobile").value.trim();
      var dob = document
        .getElementById("dob")
        .value.replaceAll("/", "-")
        .trim();
      var gender = "";
      var medication = "";
      var referral = "Ser.Brandon";

      if (male) {
        gender = "M";
      } else {
        gender = "F";
      }

      if (med_yes) {
        medication = "Y";
      } else {
        medication = "N";
      }

      var parser = new UAParser();
      // console.log(parser.getResult());
      var browser = Object.values(parser.getResult().browser)[0];
      var os =
        Object.values(parser.getResult().os)[0] +
        " " +
        Object.values(parser.getResult().os)[1];
      var model = Object.values(parser.getResult().device)[0];
      var type = Object.values(parser.getResult().device)[1];
      var vendor = Object.values(parser.getResult().device)[2];
      var cpu = Object.values(parser.getResult().cpu)[0];

      filename =
        date +
        "," +
        time +
        "," +
        name +
        "," +
        email +
        "," +
        mobile +
        "," +
        dob +
        "," +
        gender +
        "," +
        medication +
        "," +
        sampleRate +
        "," +
        browser +
        "," +
        os +
        "," +
        model +
        "," +
        type +
        "," +
        vendor +
        "," +
        cpu +
        "," +
        referral;
      file_L = new File([data_view_L], filename + ",EN" + ".wav", {
        type: "audio/wav",
      });

      var data = {
        date: date,
        time: time,
        name: name,
        email: email,
        mobile: mobile,
        dob: dob,
        gender: gender,
        medication: medication,
        sampleRate: sampleRate,
        browser: browser,
        os: os,
        model: model,
        type: type,
        vendor: vendor,
        cpu: cpu,
        referral: referral,
      };
      var jsonData = JSON.stringify(data);
      uploadFile(file_L, filename, jsonData);

      //dummey data

      //   document.getElementById("name").value = "abdul"
      //   document.getElementById("email").value = "email@server.com"
      //   document.getElementById("mobile").value = "+601160503498"
      //   document.getElementById("dob").value = "12/12/1999"
      //   document.getElementById("male").checked = false
      //   document.getElementById("female").checked = false
      //   document.getElementById("med_yes").checked = false
      //   document.getElementById("med_no").checked = false
    } else if (duration < min_duration) {
      alert(
        "Your recording duration too short. Please redo recording.\n\nRead the script aloud at a normal speed until the progress bar reaches 100%."
      );
      document.getElementById("record").scrollIntoView(true);
      redo();
    } else if (name < 1) {
      alert("Please provide your name!");
      document.getElementById("name").scrollIntoView(true);
    } else if (!v_email) {
      alert(
        "Please check and provide your actual email address to ensure receipt of report."
      );
      document.getElementById("email").scrollIntoView(true);
    } else if (!v_mobile) {
      alert(
        "Please provide real mobile number! (including + country code)\n Example: +XX-XXXXXXXXX"
      );
      document.getElementById("mobile").scrollIntoView(true);
    } else if (!v_dob) {
      alert("Enter your date of birth in DD/MM/YYYY format ONLY.");
      document.getElementById("dob").scrollIntoView(true);
    } else if (!male && !female) {
      alert("Please select gender!");
      document.getElementById("dob").scrollIntoView(true);
    } else if (!med_yes && !med_no) {
      alert("Please select whether you are taking any medication!");
      document.getElementById("dob").scrollIntoView(true);
    }
  }

  visualSelect.onchange = function () {
    window.cancelAnimationFrame(drawVisual);
    visualize();
  };

  micSelect.onchange = async (e) => {
    console.log("now use device ", micSelect.value);
    stream.getTracks().forEach(function (track) {
      track.stop();
    });
    context.close();

    stream = await getStream({
      audio: {
        deviceId: { exact: micSelect.value },
      },
      video: false,
    });
    setUpRecording();
  };

  function pause() {
    recording = false;
    context.suspend();
  }

  function resume() {
    recording = true;
    context.resume();
  }

  function ValidateEmail(inputText) {
    var mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (inputText.match(mailformat)) {
      return true;
    } else {
      return false;
    }
  }

  function ValidateDOB(inputText) {
    var regex = /(((0|1)[0-9]|2[0-9]|3[0-1])\/(0[1-9]|1[0-2])\/((19|20)\d\d))$/;

    //Check whether valid dd/MM/yyyy Date Format.
    if (regex.test(inputText)) {
      //Test which seperator is used '/' or '-'
      var opera1 = inputText.split("/");
      var opera2 = inputText.split("-");
      lopera1 = opera1.length;
      lopera2 = opera2.length;

      // Extract the string into month, date and year
      if (lopera1 > 1) {
        var pdate = inputText.split("/");
      } else if (lopera2 > 1) {
        var pdate = inputText.split("-");
      }

      var dd = parseInt(pdate[0]);
      var mm = parseInt(pdate[1]);
      var yy = parseInt(pdate[2]);

      // Create list of days of a month [assume there is no leap year by default]
      var ListofDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      if (mm == 1 || mm > 2) {
        if (dd > ListofDays[mm - 1]) {
          return false;
        } else return true;
      }

      if (mm == 2) {
        var lyear = false;
        if ((!(yy % 4) && yy % 100) || !(yy % 400)) {
          lyear = true;
        }

        if (lyear == false && dd >= 29) {
          return false;
        } else if (lyear == true && dd > 29) {
          return false;
        } else return true;
      }
    } else {
      return false;
    }
  }

  function phonenumber(inputtxt) {
    if (isValidNumber(inputtxt)) {
      return true;
    } else {
      return false;
    }
  }

  // Number will be with country code
  function isValidNumber(number) {
    try {
      return new libphonenumber.parsePhoneNumber(number).isValid();
    } catch (error) {
      return false;
    }
  }
})();

async function uploadFile(file, fName, jsonData) {
  let formData = new FormData();
  formData.append("file", file, fName);

  try {
    const response = await fetch(`upload.php`, {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      const jsonResponse = await response;
      console.log(jsonResponse);

      alert(
        "Your recording has been uploaded successfully.\nWe will contact you as soon as possible. Thank you!"
      );

      console.log("jon", jsonData);
      // Submit jsonData to another endpoint
      const response2 = await fetch(
        "https://hook.eu1.make.com/nl5e2s4hwfh807g76y1pabns3oxf9nrp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: jsonData,
        }
      );

      if (response2.ok) {
        console.log("JSON data submitted successfully.");
      } else {
        console.error("Failed to submit JSON data.");
      }

      $("#transbox_2").addClass("hidden");
      $("#record").removeClass("inactive");
      recordButton.disabled = false;

      $("#submit").addClass("hidden");
      submitButton.disabled = true;
      submitButton.innerText = "Submit";

      setTimeout(function () {
        location.replace("/");
      }, 1000);
    } else {
      console.error("Failed to upload file.");
      alert(
        "Failed to upload your recording.\nPlease make sure you have a stable internet and upload the recording again."
      );

      submitButton.disabled = false;
      submitButton.innerHTML = 'Upload Recording <i class="fas fa-upload"></i>';
      $("#transbox_2").addClass("hidden");
    }
  } catch (error) {
    console.error(error);
    alert(
      "Failed to upload your recording.\nPlease make sure you have a stable internet and upload the recording again."
    );

    submitButton.disabled = false;
    submitButton.innerHTML = 'Upload Recording <i class="fas fa-upload"></i>';
    $("#transbox_2").addClass("hidden");
  }
}
