import React from 'react'
import {StyleSheet, View, ActivityIndicator} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'
import {NativeStackScreenProps} from '@react-navigation/native-stack'

import {useAnalytics} from 'lib/analytics/analytics'
import {CommonNavigatorParams} from 'lib/routes/types'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {ViewHeader} from 'view/com/util/ViewHeader'
import {ScrollView, CenteredView} from 'view/com/util/Views'
import {s} from 'lib/styles'
import {useSetMinimalShellMode} from '#/state/shell'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {
  usePreferencesQuery,
  useSetSaveFeedsMutation,
} from '#/state/queries/preferences'
import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'
import {ListItem, SectionTitle} from './PinnedFeedsList.shared'
import {EmptyState} from '#/components/EmptyState'
import {InlineLink} from '#/components/Link'
import {PinnedFeedsList} from './PinnedFeedsList'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'SavedFeeds'>
export function SavedFeeds({}: Props) {
  const {_} = useLingui()
  const t = useTheme()
  const {isTabletOrDesktop} = useWebMediaQueries()
  const {screen} = useAnalytics()
  const setMinimalShellMode = useSetMinimalShellMode()
  const {data: preferences} = usePreferencesQuery()
  const {
    mutateAsync: setSavedFeeds,
    variables: optimisticSavedFeedsResponse,
    reset: resetSaveFeedsMutationState,
    error: setSavedFeedsError,
  } = useSetSaveFeedsMutation()

  /*
   * Use optimistic data if exists and no error, otherwise fallback to remote
   * data
   */
  const currentFeeds =
    optimisticSavedFeedsResponse && !setSavedFeedsError
      ? optimisticSavedFeedsResponse
      : preferences?.feeds || {saved: [], pinned: []}
  const unpinned = currentFeeds.saved.filter(f => {
    return !currentFeeds.pinned?.includes(f)
  })

  useFocusEffect(
    React.useCallback(() => {
      screen('SavedFeeds')
      setMinimalShellMode(false)
    }, [screen, setMinimalShellMode]),
  )

  return (
    <CenteredView
      style={[
        s.hContentRegion,
        t.atoms.border_contrast_medium,
        isTabletOrDesktop && styles.desktopContainer,
      ]}>
      <ViewHeader title={_(msg`Edit My Feeds`)} showOnDesktop showBorder />
      <ScrollView style={a.flex_1} contentContainerStyle={[a.border_0]}>
        {preferences?.feeds ? (
          !currentFeeds.pinned.length ? (
            <>
              <SectionTitle>
                <Trans>Pinned Feeds</Trans>
              </SectionTitle>
              <EmptyState style={[a.m_lg]}>
                <Trans>You don't have any pinned feeds.</Trans>
              </EmptyState>
            </>
          ) : (
            <PinnedFeedsList
              currentFeeds={currentFeeds}
              resetSaveFeedsMutationState={resetSaveFeedsMutationState}
              showPinBtn={unpinned.length > 0}
              setSavedFeeds={setSavedFeeds}
            />
          )
        ) : (
          <ActivityIndicator style={a.mt_xl} />
        )}
        {preferences?.feeds ? (
          unpinned.length > 0 && (
            <>
              <SectionTitle>
                <Trans>Saved Feeds</Trans>
              </SectionTitle>
              {unpinned.map(uri => (
                <ListItem
                  key={uri}
                  feedUri={uri}
                  isPinned={false}
                  resetSaveFeedsMutationState={resetSaveFeedsMutationState}
                  showPinBtn
                />
              ))}
            </>
          )
        ) : (
          <ActivityIndicator style={{marginTop: 20}} />
        )}

        <View style={[a.pb_5xl, a.px_lg, a.mt_xl]}>
          <Text style={[t.atoms.text_contrast_medium]}>
            <Trans>
              Feeds are custom algorithms that users build with a little coding
              expertise.{' '}
              <InlineLink
                style={a.text_sm}
                to="https://github.com/bluesky-social/feed-generator">
                <Trans>See this guide</Trans>
              </InlineLink>{' '}
              for more information.
            </Trans>
          </Text>
        </View>
        <View style={{height: 100}} />
      </ScrollView>
    </CenteredView>
  )
}

const styles = StyleSheet.create({
  desktopContainer: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    // @ts-ignore only rendered on web
    minHeight: '100vh',
  },
})
