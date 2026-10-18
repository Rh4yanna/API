<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    $pagina = public_path('catalogo/index.html');

    if (!file_exists($pagina)) {
        return response('Execute npm.cmd run build na pasta cinecatalogo para preparar a interface.', 503);
    }

    return response()->file($pagina, ['Content-Type' => 'text/html; charset=UTF-8']);
});
