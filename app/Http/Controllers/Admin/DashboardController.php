<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index()
    {
        $today = now()->startOfDay();
        $monthStart = now()->startOfMonth();
        $monthEnd = now()->endOfMonth();

        $monthlyRevenue = $this->monthlySeries('total');
        $monthlyOrders = $this->monthlySeries('id', 'count');
        $revenueChart = $this->lineChartPoints($monthlyRevenue->pluck('value'));
        $maxOrderCount = max(1, (int) $monthlyOrders->max('value'));

        $criticalProducts = Product::with('category')
            ->where('stock', '<=', 10)
            ->orderBy('stock')
            ->limit(5)
            ->get();

        $latestOrders = Order::latest()->limit(5)->get();

        $customerPerformance = Order::query()
            ->select('customer_name', DB::raw('SUM(total) as revenue'), DB::raw('COUNT(*) as order_count'))
            ->groupBy('customer_name')
            ->orderByDesc('revenue')
            ->limit(5)
            ->get();

        $topProducts = OrderItem::query()
            ->select('product_id', 'product_name', 'sku', DB::raw('SUM(quantity) as sold_quantity'), DB::raw('SUM(total) as revenue'))
            ->with('product')
            ->groupBy('product_id', 'product_name', 'sku')
            ->orderByDesc('sold_quantity')
            ->limit(5)
            ->get();

        $categoryDistribution = Category::query()
            ->leftJoin('products', 'products.category_id', '=', 'categories.id')
            ->select(
                'categories.id',
                'categories.name',
                DB::raw('COUNT(products.id) as product_count'),
                DB::raw('COALESCE(SUM(products.price * products.stock), 0) as inventory_value')
            )
            ->groupBy('categories.id', 'categories.name')
            ->orderByDesc('inventory_value')
            ->get();

        $categoryTotal = max(1, (float) $categoryDistribution->sum('inventory_value'));

        return view('dashboard', [
            'dateRangeLabel' => $monthStart->translatedFormat('d F Y').' - '.$monthEnd->translatedFormat('d F Y'),
            'metrics' => [
                ['title' => 'Toplam Sipariş', 'value' => number_format(Order::count(), 0, ',', '.'), 'trend' => 'Bu ay '.Order::whereBetween('created_at', [$monthStart, $monthEnd])->count().' sipariş', 'note' => '', 'icon' => 'cart'],
                ['title' => 'Bugünkü Ciro', 'value' => $this->money(Order::where('created_at', '>=', $today)->sum('total')), 'trend' => 'Bu ay '.$this->money(Order::whereBetween('created_at', [$monthStart, $monthEnd])->sum('total')), 'note' => '', 'icon' => 'wallet'],
                ['title' => 'Aktif Müşteri', 'value' => number_format(Order::distinct('customer_name')->count('customer_name'), 0, ',', '.'), 'trend' => 'Sipariş veren müşteri', 'note' => '', 'icon' => 'user'],
                ['title' => 'Stok Durumu', 'value' => number_format(Product::sum('stock'), 0, ',', '.'), 'trend' => $criticalProducts->count().' ürün kritik stokta', 'note' => '', 'icon' => 'box', 'warning' => $criticalProducts->isNotEmpty()],
                ['title' => 'Aktif Ürün', 'value' => number_format(Product::where('status', 'Aktif')->count(), 0, ',', '.'), 'trend' => Category::where('status', 'Aktif')->count().' aktif kategori', 'note' => '', 'icon' => 'store'],
                ['title' => 'Bekleyen Sipariş', 'value' => number_format(Order::whereIn('status', ['Yeni', 'Ödeme Bekliyor', 'Hazırlanıyor'])->count(), 0, ',', '.'), 'trend' => 'Aksiyon bekliyor', 'note' => '', 'icon' => 'clock'],
            ],
            'monthlyRevenue' => $monthlyRevenue,
            'monthlyOrders' => $monthlyOrders,
            'revenueChart' => $revenueChart,
            'maxOrderCount' => $maxOrderCount,
            'criticalProducts' => $criticalProducts,
            'latestOrders' => $latestOrders,
            'customerPerformance' => $customerPerformance,
            'accounting' => [
                'total_revenue' => Order::sum('total'),
                'paid_revenue' => Order::where('payment_status', 'Ödendi')->sum('total'),
                'pending_revenue' => Order::where('payment_status', 'Bekliyor')->sum('total'),
            ],
            'topProducts' => $topProducts,
            'categoryDistribution' => $categoryDistribution,
            'categoryTotal' => $categoryTotal,
        ]);
    }

    private function monthlySeries(string $column, string $aggregate = 'sum'): Collection
    {
        $months = collect(range(5, 0))->map(fn (int $offset) => now()->startOfMonth()->subMonths($offset));
        $start = $months->first()->copy()->startOfMonth();

        $rows = Order::query()
            ->selectRaw('YEAR(created_at) as year_value, MONTH(created_at) as month_value, '.($aggregate === 'count' ? 'COUNT('.$column.')' : 'SUM('.$column.')').' as value')
            ->where('created_at', '>=', $start)
            ->groupBy('year_value', 'month_value')
            ->get()
            ->keyBy(fn ($row) => $row->year_value.'-'.$row->month_value);

        return $months->map(function (Carbon $month) use ($rows) {
            $row = $rows->get($month->year.'-'.$month->month);

            return [
                'label' => $month->translatedFormat('M'),
                'value' => (float) ($row->value ?? 0),
            ];
        });
    }

    private function lineChartPoints(Collection $values): array
    {
        $max = max(1, (float) $values->max());
        $xStart = 52;
        $xGap = 94;
        $yBase = 168;
        $height = 128;

        $points = $values->values()->map(function ($value, $index) use ($max, $xStart, $xGap, $yBase, $height) {
            $x = $xStart + ($index * $xGap);
            $y = $yBase - (((float) $value / $max) * $height);

            return ['x' => round($x, 2), 'y' => round($y, 2)];
        })->all();

        $line = collect($points)->map(fn ($point) => $point['x'].' '.$point['y'])->implode(' L');
        $area = 'M'.$line.' L'.end($points)['x'].' 188 L'.$points[0]['x'].' 188 Z';

        return ['points' => $points, 'line' => 'M'.$line, 'area' => $area];
    }

    private function money(float|int|string|null $amount): string
    {
        return '₺ '.number_format((float) $amount, 2, ',', '.');
    }
}
