<?php

use App\Http\Controllers\FilmeController;
use App\Http\Controllers\CatalogoController;
use Illuminate\Support\Facades\Route;

Route::get('catalogo', [CatalogoController::class, 'listar']);
Route::get('pesquisar-filmes', [CatalogoController::class, 'listar']);
Route::get('detalhes-filme', [CatalogoController::class, 'detalhes']);
Route::apiResource('filmes', FilmeController::class)->parameters(['filmes' => 'filme']);
