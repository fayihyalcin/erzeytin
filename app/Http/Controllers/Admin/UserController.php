<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class UserController extends Controller
{
    public function customers(Request $request)
    {
        $search = trim((string) $request->query('q', ''));

        $customers = User::query()
            ->where('is_admin', false)
            ->when($search !== '', function ($query) use ($search) {
                $like = '%'.$search.'%';
                $query->where(fn ($q) => $q->where('name', 'like', $like)
                    ->orWhere('email', 'like', $like)
                    ->orWhere('phone', 'like', $like));
            })
            ->withCount('orders')
            ->withSum(['orders as paid_total' => fn ($q) => $q->where('payment_status', 'Ödendi')], 'total')
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return view('admin.customers', [
            'customers' => $customers,
            'search' => $search,
        ]);
    }

    public function admins()
    {
        return view('admin.users', [
            'admins' => User::where('is_admin', true)->orderBy('name')->get(),
        ]);
    }

    public function password(Request $request, User $user)
    {
        $data = $request->validate([
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        // 'hashed' cast'i şifreyi bir kez hash'ler; eski "beni hatırla" oturumları da geçersiz kalır.
        $user->password = $data['password'];
        $user->setRememberToken(Str::random(60));
        $user->save();

        return redirect()->back(fallback: route('admin.users.index'))
            ->with('status', $user->email.' için yeni şifre belirlendi.');
    }

    public function grant(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email', 'exists:users,email'],
        ], [
            'email.exists' => 'Bu e-posta adresiyle kayıtlı bir hesap bulunamadı.',
        ]);

        $user = User::where('email', $data['email'])->firstOrFail();
        $user->forceFill(['is_admin' => true])->save();

        return redirect()->back(fallback: route('admin.users.index'))
            ->with('status', $user->email.' artık yönetici.');
    }

    public function revoke(Request $request, User $user)
    {
        if ($user->is($request->user())) {
            throw ValidationException::withMessages([
                'user' => 'Kendi yöneticiliğinizi kaldıramazsınız.',
            ]);
        }

        DB::transaction(function () use ($user) {
            $adminCount = User::where('is_admin', true)->lockForUpdate()->count();

            if ($user->is_admin && $adminCount <= 1) {
                throw ValidationException::withMessages([
                    'user' => 'Son yöneticinin yetkisi kaldırılamaz.',
                ]);
            }

            $user->forceFill(['is_admin' => false])->save();
        });

        return redirect()->back(fallback: route('admin.users.index'))
            ->with('status', $user->email.' artık yönetici değil.');
    }
}
