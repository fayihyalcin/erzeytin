<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function edit()
    {
        return view('admin.settings', [
            'settings' => SiteSetting::current(),
        ]);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'site_title' => ['required', 'string', 'max:191'],
            'logo_path' => ['nullable', 'string', 'max:255'],
            'meta_title' => ['nullable', 'string', 'max:191'],
            'meta_description' => ['nullable', 'string', 'max:500'],
            'meta_keywords' => ['nullable', 'string', 'max:500'],
            'company_name' => ['nullable', 'string', 'max:191'],
            'tax_office' => ['nullable', 'string', 'max:191'],
            'tax_number' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:191'],
            'phone' => ['nullable', 'string', 'max:50'],
            'gsm' => ['nullable', 'string', 'max:50'],
            'whatsapp' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:1000'],
            'map_embed' => ['nullable', 'string', 'max:3000'],
            'bank_name' => ['nullable', 'string', 'max:191'],
            'bank_branch' => ['nullable', 'string', 'max:191'],
            'bank_account_holder' => ['nullable', 'string', 'max:191'],
            'bank_iban' => ['nullable', 'string', 'max:100'],
            'bank_description' => ['nullable', 'string', 'max:1000'],
            'paytr_enabled' => ['nullable', 'boolean'],
            'paytr_test_mode' => ['nullable', 'boolean'],
            'paytr_merchant_id' => ['nullable', 'string', 'max:191'],
            'paytr_merchant_key' => ['nullable', 'string', 'max:191'],
            'paytr_merchant_salt' => ['nullable', 'string', 'max:191'],
            'card_provider' => ['nullable', 'string', 'max:191'],
            'api_base_url' => ['nullable', 'url', 'max:255'],
            'api_key' => ['nullable', 'string', 'max:255'],
            'api_secret' => ['nullable', 'string', 'max:255'],
        ]);

        $data['paytr_enabled'] = $request->boolean('paytr_enabled');
        $data['paytr_test_mode'] = $request->boolean('paytr_test_mode');

        SiteSetting::current()->update($data);

        return to_route('admin.settings.edit')->with('status', 'Ayarlar güncellendi.');
    }
}
