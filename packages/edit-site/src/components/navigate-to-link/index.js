/**
 * WordPress dependencies
 */
import { getPath, getQueryString, addQueryArgs } from '@wordpress/url';
import { useState, useEffect, useMemo } from '@wordpress/element';
import { __experimentalResolveSelect as resolveSelect } from '@wordpress/data';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Browser dependencies
 */
const { fetch } = window;

function getPathFromLink( link ) {
	// TODO: Explore abstracting this into `@wordpress/url`.
	const path = getPath( link );
	const queryString = getQueryString( link );
	let value = '/';
	if ( path ) value += path;
	if ( queryString ) value += `?${ queryString }`;
	return value;
}
export default function NavigateToLink( {
	url,
	type,
	id,
	activePage,
	onActivePageAndTemplateIdChange,
} ) {
	const [ templateId, setTemplateId ] = useState();
	useEffect( () => {
		const effect = async () => {
			try {
				const { success, data } = await fetch(
					addQueryArgs( url, { '_wp-find-template': true } )
				).then( ( res ) => res.json() );
				if ( success ) {
					let newTemplateId = data.ID;
					if ( newTemplateId === null ) {
						newTemplateId = (
							await resolveSelect( 'core' ).getEntityRecords(
								'postType',
								'wp_template',
								{
									resolved: true,
									slug: data.post_name,
								}
							)
						 )[ 0 ].id;
					}
					setTemplateId( newTemplateId );
				} else {
					throw new Error();
				}
			} catch ( err ) {
				setTemplateId( null );
			}
		};
		effect();
	}, [ url ] );
	const onClick = useMemo( () => {
		if ( ! templateId || ! type || ! id || type === 'URL' ) return null;
		const path = getPathFromLink( url );
		if ( path === activePage.path ) return null;
		return () =>
			onActivePageAndTemplateIdChange( {
				page: {
					path,
					context: { postType: type, postId: id },
				},
				templateId,
			} );
	}, [
		templateId,
		type,
		id,
		getPathFromLink,
		url,
		onActivePageAndTemplateIdChange,
	] );
	return (
		onClick && (
			<Button
				icon="welcome-write-blog"
				label={ __( 'Edit Page Template' ) }
				onClick={ onClick }
			/>
		)
	);
}
