/** @format */

/**
 * External dependencies
 */

import React from 'react';
import { pickBy } from 'lodash';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import CurrentTheme from 'my-sites/themes/current-theme';
import SidebarNavigation from 'my-sites/sidebar-navigation';
import ThanksModal from 'my-sites/themes/thanks-modal';
import config from 'config';
import JetpackReferrerMessage from './jetpack-referrer-message';
import JetpackUpgradeMessage from './jetpack-upgrade-message';
import JetpackManageDisabledMessage from './jetpack-manage-disabled-message';
import { connectOptions } from './theme-options';
import Banner from 'components/banner';
import { FEATURE_UNLIMITED_PREMIUM_THEMES, PLAN_JETPACK_BUSINESS } from 'lib/plans/constants';
import QuerySitePlans from 'components/data/query-site-plans';
import QuerySitePurchases from 'components/data/query-site-purchases';
import ThemeShowcase from './theme-showcase';
import ThemesSelection from './themes-selection';
import { addTracking } from './helpers';
import { hasFeature, isRequestingSitePlans } from 'state/sites/plans/selectors';
import { getLastThemeQuery, getThemesFoundForQuery } from 'state/themes/selectors';
import {
	canJetpackSiteManage,
	hasJetpackSiteJetpackThemes,
	hasJetpackSiteJetpackThemesExtendedFeatures,
	isJetpackSiteMultiSite,
} from 'state/sites/selectors';

const ConnectedThemesSelection = connectOptions( props => {
	return (
		<ThemesSelection
			{ ...props }
			getOptions={ function( theme ) {
				return pickBy(
					addTracking( props.options ),
					option => ! ( option.hideForTheme && option.hideForTheme( theme, props.siteId ) )
				);
			} }
		/>
	);
} );

const ConnectedSingleSiteJetpack = connectOptions( props => {
	const {
		analyticsPath,
		analyticsPageTitle,
		canManage,
		emptyContent,
		filter,
		getScreenshotOption,
		hasJetpackThemes,
		showWpcomThemesList,
		search,
		siteId,
		vertical,
		tier,
		translate,
		hasUnlimitedPremiumThemes,
		requestingSitePlans,
	} = props;
	const jetpackEnabled = config.isEnabled( 'manage/themes-jetpack' );

	if ( ! jetpackEnabled ) {
		return (
			<JetpackReferrerMessage
				siteId={ siteId }
				analyticsPath={ analyticsPath }
				analyticsPageTitle={ analyticsPageTitle }
			/>
		);
	}
	if ( ! hasJetpackThemes ) {
		return <JetpackUpgradeMessage siteId={ siteId } />;
	}
	if ( ! canManage ) {
		return <JetpackManageDisabledMessage siteId={ siteId } />;
	}

	return (
		<div>
			<SidebarNavigation />
			<CurrentTheme siteId={ siteId } />
			{ ! requestingSitePlans &&
				! hasUnlimitedPremiumThemes && (
					<Banner
						plan={ PLAN_JETPACK_BUSINESS }
						title={ translate( 'Access all our premium themes with our Professional plan!' ) }
						description={ translate(
							'In addition to more than 100 premium themes, ' +
								'get Elasticsearch-powered site search, real-time offsite backups, ' +
								'and security scanning.'
						) }
						event="themes_plans_free_personal_premium"
					/>
				) }
			<ThemeShowcase
				{ ...props }
				siteId={ siteId }
				emptyContent={ showWpcomThemesList ? <div /> : null }
			>
				{ siteId && <QuerySitePlans siteId={ siteId } /> }
				{ siteId && <QuerySitePurchases siteId={ siteId } /> }
				<ThanksModal source={ 'list' } />
				{ showWpcomThemesList && (
					<div>
						<ConnectedThemesSelection
							origin="wpcom"
							defaultOption={ 'activate' }
							secondaryOption={ 'tryandcustomize' }
							search={ search }
							tier={ tier }
							filter={ filter }
							vertical={ vertical }
							siteId={ siteId /* This is for the options in the '...' menu only */ }
							getScreenshotUrl={ function( theme ) {
								if ( ! getScreenshotOption( theme ).getUrl ) {
									return null;
								}
								return getScreenshotOption( theme ).getUrl( theme );
							} }
							onScreenshotClick={ function( themeId ) {
								if ( ! getScreenshotOption( themeId ).action ) {
									return;
								}
								getScreenshotOption( themeId ).action( themeId );
							} }
							getActionLabel={ function( theme ) {
								return getScreenshotOption( theme ).label;
							} }
							trackScrollPage={ props.trackScrollPage }
							source="wpcom"
							emptyContent={ emptyContent }
						/>
					</div>
				) }
			</ThemeShowcase>
		</div>
	);
} );

export default connect( ( state, { siteId, tier } ) => {
	const isMultisite = isJetpackSiteMultiSite( state, siteId );
	const showWpcomThemesList =
		config.isEnabled( 'manage/themes/upload' ) &&
		hasJetpackSiteJetpackThemesExtendedFeatures( state, siteId ) &&
		! isMultisite;
	let emptyContent = null;
	if ( showWpcomThemesList ) {
		const siteQuery = getLastThemeQuery( state, siteId );
		const wpcomQuery = getLastThemeQuery( state, 'wpcom' );
		const siteThemesCount = getThemesFoundForQuery( state, siteId, siteQuery );
		const wpcomThemesCount = getThemesFoundForQuery( state, 'wpcom', wpcomQuery );
		emptyContent = ! siteThemesCount && ! wpcomThemesCount ? null : <div />;
	}
	return {
		canManage: canJetpackSiteManage( state, siteId ),
		hasJetpackThemes: hasJetpackSiteJetpackThemes( state, siteId ),
		tier,
		showWpcomThemesList,
		emptyContent,
		isMultisite,
		hasUnlimitedPremiumThemes: hasFeature( state, siteId, FEATURE_UNLIMITED_PREMIUM_THEMES ),
		requestingSitePlans: isRequestingSitePlans( state, siteId ),
	};
} )( ConnectedSingleSiteJetpack );
