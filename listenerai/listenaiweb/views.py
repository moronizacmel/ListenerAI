from django.shortcuts import render

from django.http import HttpResponse

# Create your views here.

def listening (request):
    return HttpResponse("Listening")
