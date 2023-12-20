from django.shortcuts import render

from django.http import HttpResponse

# Create your views here.

def index (request):

    return render(request, 'index.html')


def listen (request):
    if request.method == 'POST':
        audio = request.POST['audio']
    else:
        return render(request, 'listening.html')
    