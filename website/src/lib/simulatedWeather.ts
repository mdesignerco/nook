import { useEffect, useMemo, useState } from "react";
import {
	Cloud,
	CloudDrizzle,
	CloudFog,
	CloudLightning,
	CloudRain,
	CloudSnow,
	Moon,
	Sun,
	Thermometer,
	type LucideProps
} from "lucide-react";
import type { ComponentType } from "react";

export interface SimCity {
	name: string;
	country: string;
	celsius: number;
	condition: string;
}

/**
 * The desktop app reads live weather from Open-Meteo. This demo keeps the same
 * shape (city, temperature, condition, icon) but serves it from a fixed table so
 * the page stays a self-contained demo that works offline.
 */
export const SIM_CITIES: SimCity[] = [
	{ name: "New Delhi", country: "India", celsius: 24, condition: "Partly Cloudy" },
	{ name: "Mumbai", country: "India", celsius: 29, condition: "Humid" },
	{ name: "Bengaluru", country: "India", celsius: 22, condition: "Rain Showers" },
	{ name: "Kolkata", country: "India", celsius: 27, condition: "Mostly Clear" },
	{ name: "London", country: "United Kingdom", celsius: 13, condition: "Overcast" },
	{ name: "Dublin", country: "Ireland", celsius: 11, condition: "Rainy" },
	{ name: "Lisbon", country: "Portugal", celsius: 19, condition: "Clear" },
	{ name: "Madrid", country: "Spain", celsius: 21, condition: "Clear" },
	{ name: "Berlin", country: "Germany", celsius: 14, condition: "Foggy" },
	{ name: "Stockholm", country: "Sweden", celsius: 6, condition: "Snowy" },
	{ name: "New York", country: "United States", celsius: 18, condition: "Mostly Clear" },
	{ name: "San Francisco", country: "United States", celsius: 16, condition: "Foggy" },
	{ name: "Chicago", country: "United States", celsius: 12, condition: "Snow Showers" },
	{ name: "Mexico City", country: "Mexico", celsius: 20, condition: "Partly Cloudy" },
	{ name: "Bogotá", country: "Colombia", celsius: 14, condition: "Rainy" },
	{ name: "Medellín", country: "Colombia", celsius: 23, condition: "Stormy" },
	{ name: "São Paulo", country: "Brazil", celsius: 20, condition: "Rain Showers" },
	{ name: "Buenos Aires", country: "Argentina", celsius: 17, condition: "Clear" },
	{ name: "Tokyo", country: "Japan", celsius: 19, condition: "Drizzle" },
	{ name: "Seoul", country: "South Korea", celsius: 15, condition: "Overcast" },
	{ name: "Sydney", country: "Australia", celsius: 21, condition: "Clear" },
	{ name: "Auckland", country: "New Zealand", celsius: 14, condition: "Rainy" },
	{ name: "Cairo", country: "Egypt", celsius: 31, condition: "Clear" },
	{ name: "Lagos", country: "Nigeria", celsius: 28, condition: "Stormy" },
	{ name: "Cape Town", country: "South Africa", celsius: 18, condition: "Clear" },
	{ name: "Reykjavík", country: "Iceland", celsius: 3, condition: "Snowy" },
	{ name: "Vancouver", country: "Canada", celsius: 9, condition: "Rainy" },
	{ name: "Honolulu", country: "United States", celsius: 26, condition: "Partly Cloudy" }
];

export const DEFAULT_CITY = "New Delhi";

export function findCity(name: string): SimCity {
	return SIM_CITIES.find((city) => city.name === name) ?? SIM_CITIES[0];
}

export function searchCities(query: string): SimCity[] {
	const q = query.trim().toLowerCase();
	if (!q) return SIM_CITIES.slice(0, 8);
	return SIM_CITIES.filter(
		(city) =>
			city.name.toLowerCase().includes(q) || city.country.toLowerCase().includes(q)
	).slice(0, 8);
}

export function toFahrenheit(celsius: number): number {
	return Math.round(celsius * 1.8 + 32);
}

export function weatherIcon(condition: string, isDay = true): ComponentType<LucideProps> {
	switch (condition) {
		case "Clear":
		case "Mostly Clear":
			return isDay ? Sun : Moon;
		case "Partly Cloudy":
		case "Overcast":
		case "Humid":
			return Cloud;
		case "Foggy":
			return CloudFog;
		case "Drizzle":
		case "Freezing Drizzle":
			return CloudDrizzle;
		case "Rainy":
		case "Rain Showers":
		case "Freezing Rain":
			return CloudRain;
		case "Snowy":
		case "Snow Showers":
			return CloudSnow;
		case "Stormy":
			return CloudLightning;
		default:
			return Thermometer;
	}
}

export interface SimulatedWeather {
	temperature: number;
	unit: "C" | "F";
	condition: string;
	icon: ComponentType<LucideProps>;
}

/**
 * Temperature wanders a degree or two around the city's base value so the
 * readout feels live without ever moving far from the table.
 */
export function useSimulatedWeather(cityName: string, fahrenheit: boolean): SimulatedWeather {
	const city = findCity(cityName);
	const [drift, setDrift] = useState(0);

	useEffect(() => {
		const id = window.setInterval(() => {
			setDrift((prev) => {
				const swing = Math.round(Math.random() * 2) - 1;
				return Math.max(-3, Math.min(3, prev + swing));
			});
		}, 45_000);
		return () => window.clearInterval(id);
	}, []);

	return useMemo(() => {
		const celsius = city.celsius + drift;
		return {
			temperature: fahrenheit ? toFahrenheit(celsius) : celsius,
			unit: fahrenheit ? "F" : "C",
			condition: city.condition,
			icon: weatherIcon(city.condition)
		};
	}, [city, fahrenheit, drift]);
}
