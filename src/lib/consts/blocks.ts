import type { IBlockDefinition } from '$lib/types';

export default [
	{
		icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5H11V19H8V21H16V19H13V5H16V3H8V5ZM2 7C1.44772 7 1 7.44772 1 8V16C1 16.5523 1.44772 17 2 17H8V15H3V9H8V7H2ZM16 9H21V15H16V17H22C22.5523 17 23 16.5523 23 16V8C23 7.44772 22.5523 7 22 7H16V9Z"></path></svg>',
		options: [
			{
				label: '$_label.max_length',
				name: 'maxLength',
				options: {
					min: 0
				},
				type: 'NumberInput'
			}
		],
		type: 'TextInput'
	},
	{
		icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M15 18H16.5C17.8807 18 19 16.8807 19 15.5C19 14.1193 17.8807 13 16.5 13H3V11H16.5C18.9853 11 21 13.0147 21 15.5C21 17.9853 18.9853 20 16.5 20H15V22L11 19L15 16V18ZM3 4H21V6H3V4ZM9 18V20H3V18H9Z"></path></svg>',
		options: [
			{
				label: '$_label.max_length',
				name: 'maxLength',
				options: {
					min: 0
				},
				type: 'NumberInput'
			}
		],
		type: 'MultiLineTextInput'
	},
	{
		icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M7.78428 14L8.2047 10H4V8H8.41491L8.94043 3H10.9514L10.4259 8H14.4149L14.9404 3H16.9514L16.4259 8H20V10H16.2157L15.7953 14H20V16H15.5851L15.0596 21H13.0486L13.5741 16H9.58509L9.05957 21H7.04855L7.57407 16H4V14H7.78428ZM9.7953 14H13.7843L14.2047 10H10.2157L9.7953 14Z"></path></svg>',
		options: [
			{
				label: '$_label.min_value',
				name: 'min',
				options: {},
				size: 'xs',
				type: 'NumberInput'
			},
			{
				label: '$_label.max_value',
				name: 'max',
				options: {},
				size: 'xs',
				type: 'NumberInput'
			},
			{
				label: '$_label.number_step',
				name: 'step',
				options: {},
				size: 'xs',
				type: 'NumberInput'
			},
			{
				label: '$_label.unit',
				name: 'unit',
				options: {},
				size: 'xs',
				type: 'TextInput'
			}
		],
		type: 'NumberInput'
	},
	{
		icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M9 1V3H15V1H17V3H21C21.5523 3 22 3.44772 22 4V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V4C2 3.44772 2.44772 3 3 3H7V1H9ZM20 11H4V19H20V11ZM11 13V17H6V13H11ZM7 5H4V9H20V5H17V7H15V5H9V7H7V5Z"></path></svg>',
		options: [
			{
				label: '$_label.date_and_time',
				name: 'datetime',
				options: {},
				type: 'ToggleInput'
			},
			{
				label: '$_label.min_value',
				name: 'min',
				options: {},
				type: 'TextInput'
			},
			{
				label: '$_label.max_value',
				name: 'max',
				options: {},
				type: 'TextInput'
			}
		],
		type: 'DateTimeInput'
	},
	{
		icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M9.36556 10.6821C10.302 12.3288 11.6712 13.698 13.3179 14.6344L14.2024 13.3961C14.4965 12.9845 15.0516 12.8573 15.4956 13.0998C16.9024 13.8683 18.4571 14.3353 20.0789 14.4637C20.599 14.5049 21 14.9389 21 15.4606V19.9234C21 20.4361 20.6122 20.8657 20.1022 20.9181C19.5723 20.9726 19.0377 21 18.5 21C9.93959 21 3 14.0604 3 5.5C3 4.96227 3.02742 4.42771 3.08189 3.89776C3.1343 3.38775 3.56394 3 4.07665 3H8.53942C9.0611 3 9.49513 3.40104 9.5363 3.92109C9.66467 5.54288 10.1317 7.09764 10.9002 8.50444C11.1427 8.9484 11.0155 9.50354 10.6039 9.79757L9.36556 10.6821ZM6.84425 10.0252L8.7442 8.66809C8.20547 7.50514 7.83628 6.27183 7.64727 5H5.00907C5.00303 5.16632 5 5.333 5 5.5C5 12.9558 11.0442 19 18.5 19C18.667 19 18.8337 18.997 19 18.9909V16.3527C17.7282 16.1637 16.4949 15.7945 15.3319 15.2558L13.9748 17.1558C13.4258 16.9425 12.8956 16.6915 12.3874 16.4061L12.3293 16.373C10.3697 15.2587 8.74134 13.6303 7.627 11.6707L7.59394 11.6126C7.30849 11.1044 7.05754 10.5742 6.84425 10.0252Z"></path></svg>',
		options: [
			{
				label: '$_label.allowed_countries',
				help: '$_help.allowed_countries',
				name: 'allowedCountries',
				options: {},
				type: 'MultiLineTextInput'
			}
		],
		type: 'PhoneInput'
	},
	{
		icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M18.3638 15.5355L16.9496 14.1213L18.3638 12.7071C20.3164 10.7545 20.3164 7.58866 18.3638 5.63604C16.4112 3.68341 13.2453 3.68341 11.2927 5.63604L9.87849 7.05025L8.46428 5.63604L9.87849 4.22182C12.6122 1.48815 17.0443 1.48815 19.778 4.22182C22.5117 6.95549 22.5117 11.3876 19.778 14.1213L18.3638 15.5355ZM15.5353 18.364L14.1211 19.7782C11.3875 22.5118 6.95531 22.5118 4.22164 19.7782C1.48797 17.0445 1.48797 12.6123 4.22164 9.87868L5.63585 8.46446L7.05007 9.87868L5.63585 11.2929C3.68323 13.2455 3.68323 16.4113 5.63585 18.364C7.58847 20.3166 10.7543 20.3166 12.7069 18.364L14.1211 16.9497L15.5353 18.364ZM14.8282 7.75736L16.2425 9.17157L9.17139 16.2426L7.75717 14.8284L14.8282 7.75736Z"></path></svg>',
		type: 'UrlInput'
	},
	{
		icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20C13.6418 20 15.1681 19.5054 16.4381 18.6571L17.5476 20.3214C15.9602 21.3818 14.0523 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12V13.5C22 15.433 20.433 17 18.5 17C17.2958 17 16.2336 16.3918 15.6038 15.4659C14.6942 16.4115 13.4158 17 12 17C9.23858 17 7 14.7614 7 12C7 9.23858 9.23858 7 12 7C13.1258 7 14.1647 7.37209 15.0005 8H17V13.5C17 14.3284 17.6716 15 18.5 15C19.3284 15 20 14.3284 20 13.5V12ZM12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9Z"></path></svg>',
		type: 'EmailInput'
	},
	{
		icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20C13.6418 20 15.1681 19.5054 16.4381 18.6571L17.5476 20.3214C15.9602 21.3818 14.0523 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12V13.5C22 15.433 20.433 17 18.5 17C17.2958 17 16.2336 16.3918 15.6038 15.4659C14.6942 16.4115 13.4158 17 12 17C9.23858 17 7 14.7614 7 12C7 9.23858 9.23858 7 12 7C13.1258 7 14.1647 7.37209 15.0005 8H17V13.5C17 14.3284 17.6716 15 18.5 15C19.3284 15 20 14.3284 20 13.5V12ZM12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9Z"></path></svg>',
		type: 'AddressInput'
	},
	{
		icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M4 3H20C20.5523 3 21 3.44772 21 4V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V4C3 3.44772 3.44772 3 4 3ZM5 5V19H19V5H5ZM11.0026 16L6.75999 11.7574L8.17421 10.3431L11.0026 13.1716L16.6595 7.51472L18.0737 8.92893L11.0026 16Z"></path></svg>',
		type: 'CheckboxInput'
	},
	{
		icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M18.2072 9.0428 12.0001 2.83569 5.79297 9.0428 7.20718 10.457 12.0001 5.66412 16.793 10.457 18.2072 9.0428ZM5.79282 14.9572 11.9999 21.1643 18.207 14.9572 16.7928 13.543 11.9999 18.3359 7.20703 13.543 5.79282 14.9572Z"></path></svg>',
		options: [
			{
				label: '$_label.select_input_options',
				help: '$_help.select_input_options',
				name: 'options',
				options: {},
				type: 'MultiLineTextInput'
			}
		],
		type: 'SelectInput'
	},
	{
		icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M6.99979 7V3C6.99979 2.44772 7.4475 2 7.99979 2H20.9998C21.5521 2 21.9998 2.44772 21.9998 3V16C21.9998 16.5523 21.5521 17 20.9998 17H17V20.9925C17 21.5489 16.551 22 15.9925 22H3.00728C2.45086 22 2 21.5511 2 20.9925L2.00276 8.00748C2.00288 7.45107 2.4518 7 3.01025 7H6.99979ZM8.99979 7H15.9927C16.549 7 17 7.44892 17 8.00748V15H19.9998V4H8.99979V7ZM15 9H4.00255L4.00021 20H15V9ZM8.50242 18L4.96689 14.4645L6.3811 13.0503L8.50242 15.1716L12.7451 10.9289L14.1593 12.3431L8.50242 18Z"></path></svg>',
		options: [
			{
				label: '$_label.select_input_options',
				help: '$_help.select_input_options',
				name: 'options',
				options: {},
				type: 'MultiLineTextInput'
			},
			{
				label: '$_label.max_items',
				name: 'maxItems',
				options: {
					min: 0
				},
				type: 'NumberInput'
			},
			{
				label: '$_label.inline',
				name: 'inline',
				options: {},
				type: 'ToggleInput'
			}
		],
		type: 'MultiCheckboxInput'
	},
	{
		icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20ZM11.0026 16L6.75999 11.7574L8.17421 10.3431L11.0026 13.1716L16.6595 7.51472L18.0737 8.92893L11.0026 16Z"></path></svg>',
		options: [
			{
				label: '$_label.select_input_options',
				help: '$_help.select_input_options',
				name: 'options',
				options: {},
				type: 'MultiLineTextInput'
			},
			{
				label: '$_label.inline',
				name: 'inline',
				options: {},
				type: 'ToggleInput'
			}
		],
		type: 'RadioInput'
	},
	{
		icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M18.2072 9.0428 12.0001 2.83569 5.79297 9.0428 7.20718 10.457 12.0001 5.66412 16.793 10.457 18.2072 9.0428ZM5.79282 14.9572 11.9999 21.1643 18.207 14.9572 16.7928 13.543 11.9999 18.3359 7.20703 13.543 5.79282 14.9572Z"></path></svg>',
		options: [
			{
				label: '$_label.select_input_options',
				help: '$_help.select_input_options',
				name: 'options',
				options: {},
				type: 'MultiLineTextInput'
			},
			{
				label: '$_label.max_items',
				name: 'maxItems',
				options: {
					min: 0
				},
				type: 'NumberInput'
			},
			{
				label: '$_label.allow_custom_select_input_options',
				name: 'customOptions',
				options: {},
				type: 'ToggleInput'
			}
		],
		type: 'MultiSelectInput'
	},
	{
		icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M8 7C5.23858 7 3 9.23858 3 12C3 14.7614 5.23858 17 8 17H16C18.7614 17 21 14.7614 21 12C21 9.23858 18.7614 7 16 7H8ZM8 5H16C19.866 5 23 8.13401 23 12C23 15.866 19.866 19 16 19H8C4.13401 19 1 15.866 1 12C1 8.13401 4.13401 5 8 5ZM8 15C6.34315 15 5 13.6569 5 12C5 10.3431 6.34315 9 8 9C9.65685 9 11 10.3431 11 12C11 13.6569 9.65685 15 8 15Z"></path></svg>',
		type: 'ToggleInput'
	},
	{
		icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M15 4H5V20H19V8H15V4ZM3 2.9918C3 2.44405 3.44749 2 3.9985 2H16L20.9997 7L21 20.9925C21 21.5489 20.5551 22 20.0066 22H3.9934C3.44476 22 3 21.5447 3 21.0082V2.9918ZM11 11V8H13V11H16V13H13V16H11V13H8V11H11Z"></path></svg>',
		options: [
			{
				label: '$_label.max_file_size',
				name: 'maxFileSize',
				options: {
					max: 100,
					min: 0
				},
				type: 'NumberInput'
			},
			{
				label: '$_label.allowed_file_types',
				name: 'allowedTypes',
				options: {},
				type: 'TextInput'
			},
			{
				label: '$_label.max_files',
				name: 'maxFiles',
				options: {
					max: 100,
					min: 0
				},
				type: 'NumberInput'
			},
			{
				label: '$_label.allow_multiple_files',
				name: 'multiple',
				options: {},
				type: 'ToggleInput'
			}
		],
		premium: true,
		type: 'FileInput'
	},
	{
		icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M21 15V18H24V20H21V23H19V20H16V18H19V15H21ZM21.0082 3C21.556 3 22 3.44495 22 3.9934V13H20V5H4V18.999L14 9L17 12V14.829L14 11.8284L6.827 19H14V21H2.9918C2.44405 21 2 20.5551 2 20.0066V3.9934C2 3.44476 2.45531 3 2.9918 3H21.0082ZM8 7C9.10457 7 10 7.89543 10 9C10 10.1046 9.10457 11 8 11C6.89543 11 6 10.1046 6 9C6 7.89543 6.89543 7 8 7Z"></path></svg>',
		options: [
			{
				label: '$_label.max_file_size',
				name: 'maxFileSize',
				options: {
					max: 10,
					min: 0
				},
				type: 'NumberInput'
			}
		],
		premium: true,
		type: 'ImageInput'
	},
	{
		icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12.0006 18.26L4.94715 22.2082L6.52248 14.2799L0.587891 8.7918L8.61493 7.84006L12.0006 0.5L15.3862 7.84006L23.4132 8.7918L17.4787 14.2799L19.054 22.2082L12.0006 18.26ZM12.0006 15.968L16.2473 18.3451L15.2988 13.5717L18.8719 10.2674L14.039 9.69434L12.0006 5.27502L9.96214 9.69434L5.12921 10.2674L8.70231 13.5717L7.75383 18.3451L12.0006 15.968Z"></path></svg>',
		options: [
			{
				label: '$_label.rating_style',
				name: 'style',
				options: {
					options: [
						{
							label: '$_label.rating_stars',
							value: 'stars'
						},
						{
							label: '$_label.rating_emoji',
							value: 'emoji'
						},
						{
							label: '$_label.rating_numbers',
							value: 'numbers'
						}
					]
				},
				type: 'SelectInput'
			},
			{
				label: '$_label.rating_max_value',
				name: 'max',
				default: '5',
				options: {
					max: 10,
					min: 0
				},
				type: 'NumberInput'
			}
		],
		premium: true,
		type: 'RatingInput'
	},
	{
		icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M10.0357 7.69802C8.38492 9.55932 6.5134 12.2442 4.89465 15.4817C4.64766 15.9757 4.04698 16.1759 3.55301 15.9289C3.05903 15.6819 2.8588 15.0812 3.10579 14.5873C4.79739 11.2041 6.76494 8.37171 8.53943 6.37095C9.4251 5.37234 10.2797 4.56162 11.0449 3.99131C11.4272 3.7063 11.8049 3.46806 12.1677 3.29756C12.5193 3.13234 12.921 3 13.3336 3C13.5496 3 13.7872 3.0535 14.007 3.19476C14.2233 3.33371 14.3629 3.51925 14.4495 3.69083C14.6066 4.00215 14.624 4.33473 14.6201 4.55938C14.6118 5.03651 14.4847 5.6328 14.3216 6.23975C13.9874 7.48318 13.3994 9.13104 12.8149 10.7577L12.7329 10.9858C12.1671 12.5598 11.6101 14.1093 11.248 15.3466C11.1505 15.68 11.0706 15.9792 11.0094 16.2414C11.7035 15.6835 12.5581 14.8454 13.466 13.9534L13.4956 13.9243C14.3772 13.0581 15.3098 12.1418 16.0967 11.5127C16.4872 11.2006 16.9082 10.904 17.3138 10.7322C17.6544 10.5878 18.4343 10.3532 19.0407 10.9596C19.4251 11.344 19.5318 11.8438 19.5594 12.2164C19.5883 12.6064 19.5429 13.0267 19.4725 13.4261C19.3315 14.2258 19.0483 15.159 18.7894 16.0009L18.7478 16.136C18.5165 16.8874 18.3102 17.5577 18.1926 18.0965C18.4529 17.8352 18.7734 17.4216 19.1475 16.811C19.436 16.34 20.0517 16.1921 20.5226 16.4806C20.9935 16.7691 21.1414 17.3848 20.8529 17.8557C20.3099 18.7422 19.748 19.4622 19.1519 19.9092C18.5283 20.377 17.7121 20.6407 16.8863 20.2278C16.2779 19.9235 16.1398 19.3173 16.1091 18.9819C16.0759 18.6192 16.1284 18.2233 16.1979 17.8667C16.3288 17.1944 16.5829 16.3698 16.823 15.5907L16.8777 15.4129C17.1447 14.5451 17.3873 13.734 17.5028 13.0789C17.5117 13.0284 17.5196 12.9802 17.5266 12.9341C17.4697 12.977 17.4094 13.0239 17.3455 13.0749C16.6477 13.6328 15.785 14.4788 14.8677 15.38L14.8381 15.4091C13.9566 16.2752 13.024 17.1915 12.2371 17.8206C11.8466 18.1328 11.4255 18.4293 11.02 18.6012C10.6794 18.7455 9.89947 18.9801 9.29311 18.3738C8.9843 18.065 8.9052 17.6753 8.87972 17.4382C8.8515 17.1755 8.86901 16.8971 8.90269 16.6351C8.9706 16.1069 9.12934 15.4656 9.32855 14.7849C9.70829 13.4872 10.2842 11.8852 10.8411 10.3362L10.9327 10.0814C11.5263 8.42931 12.082 6.8674 12.3901 5.72074C12.4172 5.61968 12.4418 5.52435 12.4638 5.43468C12.3924 5.48361 12.3178 5.53695 12.2401 5.59489C11.6173 6.05907 10.8627 6.76559 10.0357 7.69802Z"></path></svg>',
		options: [
			{
				label: '$_label.kind',
				name: 'kind',
				options: {
					options: [
						{
							label: '$_label.signature_drawn',
							value: 'drawn'
						},
						{
							label: '$_label.signature_certificate',
							value: 'certificate'
						},
						{
							label: '$_label.signature_other',
							value: 'other'
						}
					]
				},
				type: 'SelectInput'
			}
		],
		premium: true,
		type: 'SignatureInput'
	},
	{
		icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M20 22H4C3.44772 22 3 21.5523 3 21V3C3 2.44772 3.44772 2 4 2H20C20.5523 2 21 2.44772 21 3V21C21 21.5523 20.5523 22 20 22ZM19 20V4H5V20H19ZM8 7H16V9H8V7ZM8 11H16V13H8V11ZM8 15H13V17H8V15Z"></path></svg>',
		options: [
			{
				label: '$_label.file_name',
				name: 'fileName',
				options: {},
				type: 'TextInput'
			},
			{
				label: '$_label.text',
				name: 'text',
				options: {},
				type: 'MultiLineTextInput'
			},
			{
				label: '$_label.expanded',
				name: 'expanded',
				options: {},
				type: 'ToggleInput'
			}
		],
		premium: true,
		type: 'PdfInput',
	},
	{
		icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M3 4H21V6H3V4ZM3 19H17V21H3V19ZM3 14H21V16H3V14ZM3 9H17V11H3V9Z"></path></svg>',
		options: [
			{
				label: '$_label.text',
				name: 'text',
				options: {},
				type: 'MultiLineTextInput'
			}
		],
		type: 'TextContent'
	},
	{
		icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M5 11V13H19V11H5Z"></path></svg>',
		options: [
			{
				label: '$_label.text',
				name: 'text',
				options: {},
				type: 'TextInput'
			}
		],
		type: 'DividerContent'
	},
	{
		icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M5 11.1005L7 9.1005L12.5 14.6005L16 11.1005L19 14.1005V5H5V11.1005ZM5 13.9289V19H8.1005L11.0858 16.0147L7 11.9289L5 13.9289ZM10.9289 19H19V16.9289L16 13.9289L10.9289 19ZM4 3H20C20.5523 3 21 3.44772 21 4V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V4C3 3.44772 3.44772 3 4 3ZM15.5 10C14.6716 10 14 9.32843 14 8.5C14 7.67157 14.6716 7 15.5 7C16.3284 7 17 7.67157 17 8.5C17 9.32843 16.3284 10 15.5 10Z"></path></svg>',
		options: [
			{
				label: '$_label.image_src',
				name: 'src',
				options: {},
				type: 'UrlInput'
			},
			{
				label: '$_label.max_width',
				name: 'max_width',
				default: '',
				options: {},
				type: 'TextInput'
			}
		],
		type: 'ImageContent'
	},
] satisfies IBlockDefinition[];
