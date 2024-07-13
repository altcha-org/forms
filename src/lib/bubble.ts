export interface BubbleOptions {
	handler: () => Promise<unknown> | unknown;
	text: string;
}

function renderBubble(x: number, y: number, text: string) {
	const el = document.createElement('div');
	el.innerText = text;
	el.style.background = 'rgba(0, 0, 0, 0.85)';
	el.style.borderRadius = '3px';
	el.style.color = 'white';
	el.style.fontSize = '0.8rem';
	el.style.padding = '3px 5px';
	el.style.position = 'fixed';
	el.style.transition = 'all 1s';
	el.style.left = x + 'px';
	el.style.top = y - 20 + 'px';
	el.style.zIndex = '10000';
	document.body.appendChild(el);
	setTimeout(() => {
		el.style.top = y - 50 + 'px';
		el.style.opacity = '0';
	}, 100);
	setTimeout(() => {
		document.body.removeChild(el);
	}, 1000);
}

export default (node: HTMLElement, options: BubbleOptions) => {
	node.addEventListener('click', (ev: MouseEvent) => {
		const { x, y } = node.getBoundingClientRect();
		ev.preventDefault();
		const ret = options.handler();
		if (ret instanceof Promise) {
			ret.then((ok) => {
				if (ok !== false) {
					renderBubble(x, y, options.text);
				}
			});
		} else if (ret !== false) {
			renderBubble(x, y, options.text);
		}
	});
};
