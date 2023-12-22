const mic_btn = document.querySelector('#mic');
const playback = document.querySelector('.playback');
const text_container = document.getElementById('transcription-container');

const csrfTokenInput = mic_btn.querySelector('[name="csrfmiddlewaretoken"]');
const csrfToken = csrfTokenInput.value;

mic_btn.addEventListener('click', ToggleMic);

let can_record = false;
let is_recording = false;

let recorder = null;

let chunks = [];

const MIN_SILENCE_DURATION = 2000;
const AMPLITUDE = 0.1;

function SetupAudio(){

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia){

        navigator.mediaDevices
            .getUserMedia({
                audio: true
            })
            .then(SetupStream)
            .catch(err => {
                console.error(err)
            });
    }
}

SetupAudio();

function SetupStream(stream){
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    source.connect(analyser);

    recorder = new MediaRecorder(stream);

    recorder.ondataavailable = e => {
        chunks.push(e.data);
    } 

    recorder.onstop = e => {
        if (chunks.length > 0) {
            console.log('Sending Data: ', chunks);
            SendAudioSegment(chunks);
        }
        chunks = [];
    }

    recorder.onstart = () => {
        is_recording = true;
    
        let lastDetectionTime = Date.now();
        let currentTime = Date.now();
        let silenceStartTime = 0;
        let finishedSilence = false;
    
        function analyzeAudio() {
            if (is_recording) {
                analyser.getByteFrequencyData(dataArray);
                let averageAmplitude = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length / 256;
    
                let timeSinceLastDetection = currentTime - lastDetectionTime;
    
                if (averageAmplitude < AMPLITUDE) {
                    if (timeSinceLastDetection >= MIN_SILENCE_DURATION) {
                        if (silenceStartTime === 0) {
                            silenceStartTime = Date.now();
                        }
    
                        const silenceDuration = Date.now() - silenceStartTime;
    
                        if (silenceDuration >= MIN_SILENCE_DURATION) {
                            console.log('Silencio');
                            lastDetectionTime = Date.now();

                            if (finishedSilence){
                                finishedSilence = false;
                                recorder.stop(); 
                            }
                        }
                    }
                } else {
                    if (recorder.state == "inactive"){      
                        recorder.start();
                    }
                    silenceStartTime = 0;
                    console.log('Sound');
                    finishedSilence = true;
                }
                currentTime = Date.now();
            }
            requestAnimationFrame(analyzeAudio);
        }
        analyzeAudio();
    };
    can_record = true;
}

function ToggleMic() {
    if (!can_record) return;

    is_recording = !is_recording;

    if (is_recording){
        chunks = [];
        recorder.start();
        mic_btn.classList.add("is-recording")
    } else {
        recorder.stop();
        mic_btn.classList.remove("is-recording")
    }
}

function SendAudioSegment(segment) {
    const formData = new FormData();
    formData.append('audio', new Blob(segment, { type: "audio/mpeg" }));
    formData.append('csrfmiddlewaretoken', csrfToken);

    fetch('/listen', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(transcription => {
        console.log('Transcription:', transcription);
        showTranscriptionProgressively(transcription.transcription);
    })
    .catch(error => console.error('Error:', error));
}

function showTranscriptionProgressively(transcription) {
    let index = 0;
    const intervalId = setInterval(function() {
        text_container.innerHTML += transcription.charAt(index);
        index++;

        if (index === transcription.length) {
            clearInterval(intervalId);
        }
    }, 100);
}