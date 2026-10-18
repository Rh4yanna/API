<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Mantém os favoritos existentes e adapta o identificador à nova API.
        Schema::table('filmes', function (Blueprint $table) {
            $table->renameColumn('imdb_id', 'api_id');
        });
        Schema::table('filmes', function (Blueprint $table) {
            $table->string('api_id', 100)->change();
        });
    }

    public function down(): void
    {
        Schema::table('filmes', function (Blueprint $table) {
            $table->renameColumn('api_id', 'imdb_id');
        });
    }
};
