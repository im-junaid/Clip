from django import forms
from django.contrib.auth.forms import SetPasswordForm

class CustomSetPasswordForm(SetPasswordForm):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields.values():
            field.widget.attrs.update({
                'class': 'w-full px-4 py-2 text-sm border border-gray-700 rounded-lg bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 transition md:text-base'
            })
