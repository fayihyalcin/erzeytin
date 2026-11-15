@extends('layouts.storefront')

@section('title', $page['title'].' - '.($settings->site_title ?: 'Er Zeytin Yağı'))
@section('meta_description', $page['intro'])

@section('content')
    <section class="category-hero page-hero">
        <img src="{{ asset('images/hero-olive-grove.jpg') }}" alt="">
        <div class="category-hero-wash"></div>
        <div class="container-wide category-hero-inner">
            <nav class="breadcrumb-line" aria-label="Sayfa yolu">
                <a href="{{ route('home') }}">Anasayfa</a>
                <span>/</span>
                <strong>{{ $page['title'] }}</strong>
            </nav>
            <span class="page-kicker">{{ $page['kicker'] }}</span>
            <h1>{{ $page['title'] }}</h1>
            <p>{{ $page['intro'] }}</p>
        </div>
    </section>

    <section class="static-page container-wide">
        @if ($page['type'] === 'faq')
            <div class="faq-list">
                @foreach ($page['items'] as $item)
                    <details @if ($loop->first) open @endif>
                        <summary>{{ $item['question'] }}</summary>
                        <p>{{ $item['answer'] }}</p>
                    </details>
                @endforeach
            </div>
        @else
            <div class="policy-grid">
                @foreach ($page['sections'] as $section)
                    <article>
                        <span>{{ str_pad((string) $loop->iteration, 2, '0', STR_PAD_LEFT) }}</span>
                        <h2>{{ $section['heading'] }}</h2>
                        <p>{{ $section['body'] }}</p>
                    </article>
                @endforeach
            </div>
        @endif
    </section>
@endsection
