from django.shortcuts import render
from django.http import HttpResponse
from django.views.generic import TemplateView

def index(request):
    template_base_dir = 'homepage'
    template_to_return = f"{template_base_dir}/index.html"
    return render(request, template_to_return)