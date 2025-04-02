from django.shortcuts import render

from django.http import HttpResponse, JsonResponse, HttpRequest
from django.conf import settings

import whisper
import os
import threading

import json

# Imports for Google Gemini
import google.generativeai as genai
from dotenv import load_dotenv
load_dotenv('.env')
KEY = os.getenv('GOOGLE_GEMINI')
genai.configure(api_key=KEY)
modelGemini = genai.GenerativeModel('gemini-pro')


# For Whisper
modelWhisper = whisper.load_model("base.en")
file_counter = 1
file_lock = threading.Lock()
lastTranscript = ""


# Create your views here.
def index (request):
    return render(request, 'index.html')

def listen(request):
    global file_counter
    global lastTranscript

    if request.method == 'POST':
        audio_blob = request.FILES.get('audio')
        language = str(request.POST.get('language'))

        if audio_blob:
            audio_content = audio_blob.read()
            temp_audio_path = os.path.join(settings.MEDIA_ROOT, f'static/assets/temprecordings/temp_audio_{file_counter}.mp3')
            
            with file_lock:
                with open(temp_audio_path, 'wb') as temp_audio_file:
                    temp_audio_file.write(audio_content)


                #Whisper START

                audio = whisper.load_audio(temp_audio_path)
                audio = whisper.pad_or_trim(audio)

                mel = whisper.log_mel_spectrogram(audio).to(modelWhisper.device)

                options = whisper.DecodingOptions(fp16 = False, language=language)
                result = whisper.decode(modelWhisper, mel, options)

                lastTranscript = result.text

                #Whisper END

                os.remove(temp_audio_path)

                file_counter += 1

            return JsonResponse({'transcription': lastTranscript})

    else:
        return render(request, 'listening.html')

def gemini(request):

    if request.method == 'POST':

        data = request.POST       
        
        if 'prompt' in data:
            prompt_text = data['prompt']
            response = modelGemini.generate_content(prompt_text)
            print(response.text)
            return JsonResponse({'answer': response.text})
        else:
            return JsonResponse({"error": "The field 'prompt' is not present"}, status=400)
        
    return JsonResponse({"error": "You can only use POST"}, status=400)
