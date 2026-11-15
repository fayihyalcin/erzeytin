<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use Illuminate\Http\Request;

class ContactMessageController extends Controller
{
    public function index()
    {
        return view('admin.contact-messages', [
            'messages' => ContactMessage::latest()->get(),
        ]);
    }

    public function update(Request $request, ContactMessage $contactMessage)
    {
        $data = $request->validate([
            'status' => ['required', 'in:Yeni,Okundu,Cevaplandı,Arşiv'],
            'admin_note' => ['nullable', 'string', 'max:2000'],
        ]);

        $contactMessage->update([
            'status' => $data['status'],
            'admin_note' => $data['admin_note'] ?? null,
            'read_at' => $contactMessage->read_at ?: now(),
        ]);

        return to_route('admin.contact-messages.index')->with('status', 'İletişim talebi güncellendi.');
    }

    public function destroy(ContactMessage $contactMessage)
    {
        $contactMessage->delete();

        return to_route('admin.contact-messages.index')->with('status', 'İletişim talebi silindi.');
    }
}
