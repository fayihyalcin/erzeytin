<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsAdmin
{
    /**
     * Yalnız yönetici (is_admin) kullanıcıları geçirir.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return $request->expectsJson()
                ? abort(401)
                : redirect()->guest(route('login'));
        }

        if (! $user->is_admin) {
            return $request->expectsJson()
                ? abort(403)
                : redirect()->route('customer.dashboard');
        }

        return $next($request);
    }
}
