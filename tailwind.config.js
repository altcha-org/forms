const shared = {
	'--rounded-badge': '0.15rem',
	'--rounded-btn': '0.25rem'
};

module.exports = {
	content: ['./src/**/*.{svelte,js,ts}'],
	plugins: [require('@tailwindcss/typography'), require('daisyui')],
	daisyui: {
		themes: [
			{
				dark: {
					...require('daisyui/src/theming/themes')['dark'],
					error: '#dd1a1d',
					neutral: '#000000',
					primary: '#6565f2',
					secondary: '#1a1a77',
					'base-200': '#2d3642',
					'base-300': '#252d38',
					'error-content': '#fff',
					'neutral-content': '#fff',
					'primary-content': '#fff',
					'success-content': '#fff',
					...shared
				},
				light: {
					...require('daisyui/src/theming/themes')['light'],
					error: '#dd1a1d',
					neutral: '#000000',
					primary: '#1d1dc9',
					secondary: '#05057f',
					'error-content': '#fff',
					'neutral-content': '#fff',
					'primary-content': '#fff',
					'success-content': '#fff',
					...shared
				}
			}
		]
	},
	safelist: ['dd-over', 'bg-success/10', 'bg-primary/10', 'bg-warning/10']
};
