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

let tempTranscription = "";

let SOUND = true;

// Constants //
const DEFAULT_MIN_SILENCE_DURATION = 2000;
let MIN_SILENCE_DURATION = 2000;
const DEFAULT_NOISE_AMPLITUDE = 50; //50 more sensitive to sounds AND 100 less sensitive to sounds (From 0 to 256)
const DEFAULT_MAX_NOISE_AMPLITUDE = 60; //50 more sensitive to sounds AND 100 less sensitive to sounds (From 0 to 256)
let MIN_NOISE_AMPLITUDE = 50;

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
    analyser.fftSize = 256; //Small-Faster: 64  Medium-Regular: 256-1024    Large-Slow: 2048
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    source.connect(analyser);

    recorder = new MediaRecorder(stream);

    recorder.ondataavailable = e => {
        chunks.push(e.data);
    } 

    recorder.onstop = async e => {
        if (chunks.length > 0) {
            console.log('Sending Data: ', chunks);

            let startTime = Date.now();
            await SendAudioSegment(chunks);
            let endTime = Date.now();

            let processTime = endTime - startTime;

            console.log("Time to create audio: ", processTime);

            if (tempTranscription.includes("?")) {
                handleVoice(tempTranscription);
            }    
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
                let averageAmplitude = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;

                if (averageAmplitude < MIN_NOISE_AMPLITUDE) {

                    let timeSinceLastDetection = currentTime - lastDetectionTime;

                    if (timeSinceLastDetection >= MIN_SILENCE_DURATION) {
                        
                            SOUND = false;
                            //console.log('Silencio');
                            resetSilenceAmplitude();

                            if (finishedSilence){
                                finishedSilence = false;
                                recorder.stop(); 
                                chunks = [];
                            }
                    }

                } else {
                    SOUND = true;

                    if (recorder.state == "inactive"){      
                        recorder.start();
                    }

                    silenceStartTime = 0;
                    //console.log('Sound');
                    finishedSilence = true;

                    lastDetectionTime = Date.now();
                }
            }

            currentTime = Date.now(); //This has to be necessarily at the end

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

async function SendAudioSegment(segment) {
    const formData = new FormData();
    formData.append('audio', new Blob(segment, { type: "audio/mpeg" }));
    formData.append('csrfmiddlewaretoken', csrfToken);

    try {
        const response = await fetch('/listen', {
            method: 'POST',
            body: formData
        });

        const transcription = await response.json();
        tempTranscription = transcription.transcription;
        console.log('Transcription:', transcription);
        await showTranscriptionProgressively(tempTranscription);

    } catch (error) {
        console.error('Error:', error);
    }
}

function showTranscriptionProgressively(transcription) {
    return new Promise((resolve) => {
        let index = 0;
        const intervalId = setInterval(function () {
            text_container.innerHTML += transcription.charAt(index);
            index++;

            if (index === transcription.length) {
                clearInterval(intervalId);
                resolve();
            }
        }, 1);
    });
}

function updateSilenceAmplitude() {

    if(SOUND && is_recording){
        if (MIN_NOISE_AMPLITUDE <= DEFAULT_MAX_NOISE_AMPLITUDE){
            MIN_NOISE_AMPLITUDE = MIN_NOISE_AMPLITUDE + 1;
        }

        if (MIN_SILENCE_DURATION >= 1000){
            MIN_SILENCE_DURATION = MIN_SILENCE_DURATION - 500;
        }
        console.log(MIN_NOISE_AMPLITUDE);
    }

}

function resetSilenceAmplitude() {

    MIN_NOISE_AMPLITUDE = DEFAULT_NOISE_AMPLITUDE;
    MIN_SILENCE_DURATION = DEFAULT_MIN_SILENCE_DURATION;

}

const updateAmplitude = setInterval(updateSilenceAmplitude, 1000);

// function SendAudioSegment(segment) {
//     const formData = new FormData();
//     formData.append('audio', new Blob(segment, { type: "audio/mpeg" }));
//     formData.append('csrfmiddlewaretoken', csrfToken);

//     fetch('/listen', {
//         method: 'POST',
//         body: formData
//     })
//     .then(response => response.json())
//     .then(transcription => {
//         console.log('Transcription:', transcription);
//         showTranscriptionProgressively(transcription.transcription);
//     })
//     .catch(error => console.error('Error:', error));
// }

// function showTranscriptionProgressively(transcription) {
//     let index = 0;
//     const intervalId = setInterval(function() {
//         text_container.innerHTML += transcription.charAt(index);
//         index++;

//         if (index === transcription.length) {
//             clearInterval(intervalId);
//         }
//     }, 100);
// }