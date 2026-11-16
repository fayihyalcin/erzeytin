<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class RevokeAdmin extends Command
{
    protected $signature = 'admin:revoke {email}';

    protected $description = 'Verilen e-posta adresli kullanicinin yonetici yetkisini kaldirir';

    public function handle(): int
    {
        $user = User::where('email', $this->argument('email'))->first();

        if (! $user) {
            $this->error('Kullanici bulunamadi.');

            return self::FAILURE;
        }

        $user->forceFill(['is_admin' => false])->save();
        $this->info("{$user->email} artik yonetici degil.");

        return self::SUCCESS;
    }
}
