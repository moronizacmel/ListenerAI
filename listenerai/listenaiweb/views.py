from django.shortcuts import render

from django.http import HttpResponse, JsonResponse
from django.conf import settings


import whisper
import os

import threading


# Create your views here.

model = whisper.load_model("base.en")

file_counter = 1

file_lock = threading.Lock()

def index (request):

    return render(request, 'index.html')


def listen(request):
    global file_counter

    if request.method == 'POST':
        audio_blob = request.FILES.get('audio')

        if audio_blob:
            audio_content = audio_blob.read()
            temp_audio_path = os.path.join(settings.MEDIA_ROOT, f'static/assets/temprecordings/temp_audio_{file_counter}.mp3')

            with file_lock:
                with open(temp_audio_path, 'wb') as temp_audio_file:
                    temp_audio_file.write(audio_content)

                result = model.transcribe(temp_audio_path)
                transcription = result["text"]

                os.remove(temp_audio_path)

                file_counter += 1

            return JsonResponse({'transcription': transcription})

    else:
        return render(request, 'listening.html')

    