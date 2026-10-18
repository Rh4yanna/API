<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('filmes', function (Blueprint $table) {
            $table->id();
            $table->string('imdb_id', 20)->unique();
            $table->string('titulo');
            $table->string('ano', 20);
            $table->string('genero')->nullable();
            $table->text('sinopse')->nullable();
            $table->text('poster')->nullable();
            $table->decimal('nota', 3, 1)->nullable();
            $table->text('comentario')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('filmes');
    }
};
