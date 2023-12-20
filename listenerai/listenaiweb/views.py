from django.shortcuts import render

from django.http import HttpResponse, JsonResponse
from django.conf import settings


import whisper
import os

# Create your views here.

def index (request):

    return render(request, 'index.html')


def listen (request):
    if request.method == 'POST':


        audio_blob = request.FILES.get('audio')

        if audio_blob:

            audio_content = audio_blob.read()
            temp_audio_path = os.path.join(settings.MEDIA_ROOT, 'temp_audio.mp3')

            with open(temp_audio_path, 'wb') as temp_audio_file:
                temp_audio_file.write(audio_content)

            model = whisper.load_model("base")
            result = model.transcribe(temp_audio_path)
            transcription = result["text"]

            os.remove(temp_audio_path)

            return JsonResponse({'transcription': transcription})    

    else:
        return render(request, 'listening.html')
    