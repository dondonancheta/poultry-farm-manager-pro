<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

class UserFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name'     => $this->faker->name(),
            'email'    => $this->faker->unique()->safeEmail(),
            'password' => Hash::make('password'),
            'role'     => $this->faker->randomElement(['admin', 'manager', 'supervisor', 'worker']),
            'status'   => 'active',
            'phone'    => $this->faker->phoneNumber(),
            'building' => null,
        ];
    }

    public function admin(): static
    {
        return $this->state(['role' => 'admin']);
    }

    public function manager(): static
    {
        return $this->state(['role' => 'manager']);
    }

    public function supervisor(): static
    {
        return $this->state(['role' => 'supervisor']);
    }

    public function worker(): static
    {
        return $this->state(['role' => 'worker']);
    }

    public function inactive(): static
    {
        return $this->state(['status' => 'inactive']);
    }
}
