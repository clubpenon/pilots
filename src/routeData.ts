import { defineRouteMiddleware } from '@astrojs/starlight/route-data';

// The header logo links back to the main club website instead of this site's home page.
export const onRequest = defineRouteMiddleware((context) => {
	context.locals.starlightRoute.siteTitleHref = 'https://clubpenon.org/';
});
