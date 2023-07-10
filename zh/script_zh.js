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
  let min_duration = 230;
  let HP_filter = false;
  let delay = 0;

  // audio recorder
  recordButton = document.getElementById("record");
  recordButton.addEventListener("click", start);

  //retryUploading
  retryUploading = document.getElementById("retry");
  retryUploading.addEventListener("click", submit);

  // stop recording
  stopButton = document.getElementById("stop");
  stopButton.addEventListener("click", stop);

  // redo recording
  const redoButton = document.getElementById("redo");
  redoButton.addEventListener("click", function () {
    if (confirm("您确定要重做录音吗？")) {
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

    // creates an audio node from the microphone incoming stream
    audioInput = context.createMediaStreamSource(stream);

    // Create analyser
    analyser = context.createAnalyser();

    // connect audio input to the analyser
    audioInput.connect(analyser);

    let bufferSize = 4096;
    let recorder = context.createScriptProcessor(bufferSize, 2, 2);

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
            "您的麦克风有问题！\n\n请检查您的麦克风设置。"
          );
          // clean up;
          // stop();
          stream.getTracks().forEach(function (track) {
            track.stop();
          });
          context.close();
          $("#MAIN").addClass("hidden");
          //document.querySelector("h1").innerText = "Your microphone is muted in the browser settings!\nPlease copy the below link and open it with other browsers\nFirefox, Safari, QQ or WeChat.\n-------------------\n\n https://voiceforhealth.online";
          alert("您的麦克风在浏览器设置中已静音");
          location.replace("https://" + window.location.hostname);
        }
      }

      if (HP_filter) {
        // we clone the samples
        leftchannel.push(new Float64Array(left));
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

  async function start() {
    alert(
      " 注意：\n- 请务必找到一个安静的空间，并关闭风扇/空调。\n- 将手机调至静音模式。\n- 阅读脚本旨在提供理解和收集声音的指导。 \n- 您可以以正常速度大声朗读，直到进度条达到 100%。"
    );

    try {
      // Get the media stream with the selected microphone
      stream = await getStream({
        audio: { deviceId: micSelect.value },
        video: false,
      });
      console.log("Got stream with selected microphone");

      // Update the recording setup with the new stream
      setUpRecording(stream);

      recordButton.disabled = true;
      recordButton.innerHTML =
        '录音正在进行中 <i class="fa fa-spinner fa-spin"></i>';
      $("#stop").removeClass("hidden");
      stopButton.disabled = false;
      $("#analyser").removeClass("hidden");
      $("#progress").removeClass("hidden");
      $("#audio").addClass("hidden");
      $("#submit").addClass("hidden");
      $("#redo").addClass("hidden");
      $("#next").addClass("hidden");
      $("#transbox_2").addClass("hidden");

      const element = document.getElementById("record");
      element.scrollIntoView(true);
      recording = true;

      leftchannel.length = 0;
      recordingLength = 0;
    } catch (error) {
      console.error("Failed to get stream with selected microphone:", error);
      // Handle error as per your requirements
    }
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
        "您的录音时间太短，请重新录音。\n\n以正常速度朗读脚本，直到进度条达到100%。"
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
      file_L = new File([data_view_L], filename + ",zh" + ".wav", {
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
      uploadFile(file_L, filename + ",zh" + ".wav", jsonData);

      //dummey data

      //  document.getElementById("name").value = "abdul"
      //  document.getElementById("email").value = "email@server.com"
      //  document.getElementById("mobile").value = "+601160503498"
      //  document.getElementById("dob").value = "12/12/1999"
      //  document.getElementById("male").checked = false
      //  document.getElementById("female").checked = false
      //  document.getElementById("med_yes").checked = false
      //  document.getElementById("med_no").checked = false
    } else if (duration < min_duration) {
      alert(
        "您的录音时间太短，请重新录音。\n\n以正常速度朗读脚本，直到进度条达到100%。"
      );
      document.getElementById("record").scrollIntoView(true);
      redo();
    } else if (name < 1) {
      alert("请提供您的姓名！");
      document.getElementById("name").scrollIntoView(true);
    } else if (!v_email) {
      alert(
        "请检查并提供您的实际电子邮件地址，以确保收到报告。"
      );
      document.getElementById("email").scrollIntoView(true);
    } else if (!v_mobile) {
      alert(
        "请提供真实手机号码！ （包括+国家代码）\n 示例：+XX-XXXXXXXXX"
      );
      document.getElementById("mobile").scrollIntoView(true);
    } else if (!v_dob) {
      alert("Masukkan tarikh lahir anda dalam format DD/MM/YYYY SAHAJA.");
      document.getElementById("dob").scrollIntoView(true);
    } else if (!male && !female) {
      alert("Please select gender!");
      document.getElementById("dob").scrollIntoView(true);
    } else if (!med_yes && !med_no) {
      alert("Sila pilih sama ada anda sedang mengambil sebarang ubat!");
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

function uploadFile(file, fName, jsonData) {
  const formData = new FormData();
  formData.append("file", file, fName);

  const xhr = new XMLHttpRequest();

  xhr.upload.addEventListener("progress", (event) => {
    if (event.lengthComputable) {
      const progress = Math.round((event.loaded * 100) / event.total);
      updateProgressBar(progress);
    }
  });

  xhr.addEventListener("load", async () => {
    if (xhr.status === 200) {
      // Upload successful
      const jsonResponse = JSON.parse(xhr.responseText);
      console.log(jsonResponse);
      handleUploadSuccess(jsonData)
      updateProgressBar(progress);

    } else {
      // Upload failed
      console.error("Failed to upload file.");
    handleUploadError();
    }
  });

  xhr.addEventListener("error", () => {
    console.error("Upload error.");
    // Error handling code...
  });

  xhr.open("POST", "upload.php");
  xhr.send(formData);
}

function handleUploadSuccess(jsonData) {
  showAlert(
    "您的录音已成功上传。\n我们会尽快与您联系。谢谢！",
    "success"
  );

  // Submit jsonData to another endpoint
  fetch("https://hook.eu1.make.com/nl5e2s4hwfh807g76y1pabns3oxf9nrp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: jsonData,
  })
    .then((response) => {
      if (response.ok) {
        console.log("JSON data submitted successfully.");
        startCountdown();
      } else {
        console.error("Failed to submit JSON data.");
        hideTransBox();
      }
    })
    .catch((error) => {
      console.error("Failed to submit JSON data.", error);
    });

  hideLoader(); // Hide loading indicator
  enableSubmitButton(); // Enable submit button
}

function startCountdown() {
  let countdownElement = document.getElementById("countdown-timer");
  let countdownTime = 10; // Countdown time in seconds

  // Display the initial countdown value
  countdownElement.innerText = countdownTime;

  // Start the countdown interval
  let countdownInterval = setInterval(() => {
    countdownTime--;

    // Update the countdown value
    countdownElement.innerText = countdownTime;

    // Check if the countdown reaches 0
    if (countdownTime === 0) {
      // Redirect to the home page
      window.location.href = "/";

      // Clear the countdown interval
      clearInterval(countdownInterval);
    }
  }, 1000); // Update the countdown every 1 second
}
function handleUploadError() {
  showTransBox();
  showAlert(
    "无法上传您的录音。\n请确保您有稳定的互联网并重新上传录音。",
    "error"
  );

  //   enableSubmitButton(); // Enable submit button
  setTimeout(function () {
    showRetry();
    hideTransBox();
    showRedo();
    hideSubmitButton();
  }, 5000);
}

function updateProgressBar(progress) {
  const progressBar = document.getElementById("upload-progress");
  progressBar.style.width = `${progress}%`;
}

function showAlert(message, type) {
  const loading = document.getElementById("loading");
  loading.style.display = "none";
  console.log("hide wrapper....");
  const alertBox = document.getElementById("alert-box");
  alertBox.innerText = message;
  alertBox.className = `alert-${type}`;

  alertBox.style.display = "block";
}

function hideLoader() {
  const loader = document.getElementById("loader");
  loader.style.display = "none";
}

function enableSubmitButton() {
  const submitButton = document.getElementById("submit");
  submitButton.disabled = false;
  submitButton.innerHTML = 'Upload Recording <i class="fas fa-upload"></i>';
}

function handleUploadProgress(event) {
  if (event.lengthComputable) {
    const percentComplete = (event.loaded / event.total) * 100;
    updateProgressBar(percentComplete);
  }
}
function showTransBox() {
  const transBox2 = document.getElementById("transbox_2");
  transBox2.style.display = "block";
}

function hideTransBox() {
  const transBox2 = document.getElementById("transbox_2");
  transBox2.style.display = "none";
}

function hideAlert() {
  const alertBox = document.getElementById("alert-box");
  alertBox.style.display = "none";
  alertBox.classList.remove("success", "error");
}

function showLoader() {
  const loader = document.getElementById("loader");
  loader.style.display = "block";
}
function showRetry() {
  const retry = document.getElementById("retry");
  $("#retry").removeClass("hidden");
}
function showRedo() {
  const redo = document.getElementById("redo");
  $("#redo").removeClass("hidden");
}

function hideLoader() {
  const loader = document.getElementById("loader");
  loader.style.display = "none";
}

function disableSubmitButton() {
  const submitButton = document.getElementById("submit");
  submitButton.disabled = true;
  submitButton.innerHTML = 'Uploading <i class="fa fa-spinner fa-spin"></i>';
}
function hideSubmitButton() {
  const submitButton = document.getElementById("submit");
  submitButton.style.display = "none";
}

function enableSubmitButton() {
  const submitButton = document.getElementById("submit");
  submitButton.disabled = false;
  submitButton.innerHTML = "Submit";
}
