import React from 'react'
import {Trans, msg} from '@lingui/macro'
import {Button, ButtonText} from '#/components/Button'
import {useLingui} from '@lingui/react'
import {LayoutAnimation, View} from 'react-native'

import {useSetSaveFeedsMutation} from '#/state/queries/preferences'
import {ListItem, SectionTitle} from './PinnedFeedsList.shared'
import {atoms as a} from '#/alf'
import {
  ChevronBottom_Stroke2_Corner0_Rounded as ChevronBottom,
  ChevronTop_Stroke2_Corner0_Rounded as ChevronTop,
} from '#/components/icons/Chevron'
import {track} from '#/lib/analytics/analytics'
import {logger} from '#/logger'
import * as Toast from '#/view/com/util/Toast'

export function PinnedFeedsList({
  currentFeeds,
  resetSaveFeedsMutationState,
  showPinBtn,
  setSavedFeeds,
}: {
  currentFeeds: {
    saved: string[]
    pinned: string[]
  }
  resetSaveFeedsMutationState: ReturnType<
    typeof useSetSaveFeedsMutation
  >['reset']
  showPinBtn?: boolean
  setSavedFeeds: ReturnType<typeof useSetSaveFeedsMutation>['mutateAsync']
}) {
  const {_} = useLingui()
  const [isReordering, setIsReordering] = React.useState(false)

  return (
    <>
      <SectionTitle
        button={
          <Button
            label={
              isReordering
                ? _(msg`Stop reordering`)
                : _(msg`Reorder pinned feeds`)
            }
            size="small"
            color={isReordering ? 'primary' : 'secondary'}
            variant="solid"
            onPress={() => {
              LayoutAnimation.configureNext(
                LayoutAnimation.Presets.easeInEaseOut,
              )
              setIsReordering(r => !r)
            }}>
            <ButtonText>
              {isReordering ? <Trans>Done</Trans> : <Trans>Reorder</Trans>}
            </ButtonText>
          </Button>
        }>
        <Trans>Pinned Feeds</Trans>
      </SectionTitle>
      {currentFeeds.pinned.map(uri => (
        <SortableListItem
          key={uri}
          feedUri={uri}
          resetSaveFeedsMutationState={resetSaveFeedsMutationState}
          isReordering={isReordering}
          showPinBtn={showPinBtn}
          currentFeeds={currentFeeds}
          setSavedFeeds={setSavedFeeds}
        />
      ))}
    </>
  )
}
function SortableListItem({
  feedUri,
  resetSaveFeedsMutationState,
  isReordering,
  showPinBtn,
  currentFeeds,
  setSavedFeeds,
}: {
  feedUri: string
  resetSaveFeedsMutationState: () => void
  isReordering: boolean
  showPinBtn?: boolean
  currentFeeds: {
    saved: string[]
    pinned: string[]
  }
  setSavedFeeds: ReturnType<typeof useSetSaveFeedsMutation>['mutateAsync']
}) {
  const {_} = useLingui()

  const onPressUp = React.useCallback(async () => {
    // create new array, do not mutate
    const pinned = [...currentFeeds.pinned]
    const index = pinned.indexOf(feedUri)

    if (index === -1 || index === 0) return
    ;[pinned[index], pinned[index - 1]] = [pinned[index - 1], pinned[index]]

    try {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
      await setSavedFeeds({saved: currentFeeds.saved, pinned})
      track('CustomFeed:Reorder', {
        uri: feedUri,
        index: pinned.indexOf(feedUri),
      })
    } catch (e) {
      Toast.show(_(msg`There was an issue contacting the server`))
      logger.error('Failed to set pinned feed order', {message: e})
    }
  }, [feedUri, setSavedFeeds, currentFeeds, _])

  const onPressDown = React.useCallback(async () => {
    const pinned = [...currentFeeds.pinned]
    const index = pinned.indexOf(feedUri)

    if (index === -1 || index >= pinned.length - 1) return
    ;[pinned[index], pinned[index + 1]] = [pinned[index + 1], pinned[index]]

    try {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
      await setSavedFeeds({saved: currentFeeds.saved, pinned})
      track('CustomFeed:Reorder', {
        uri: feedUri,
        index: pinned.indexOf(feedUri),
      })
    } catch (e) {
      Toast.show(_(msg`There was an issue contacting the server`))
      logger.error('Failed to set pinned feed order', {message: e})
    }
  }, [feedUri, setSavedFeeds, currentFeeds, _])

  return (
    <View style={[a.flex_1, a.flex_row, a.justify_between, a.align_center]}>
      <ListItem
        feedUri={feedUri}
        isPinned
        resetSaveFeedsMutationState={resetSaveFeedsMutationState}
        showSaveBtn={!isReordering}
        showPinBtn={!isReordering && showPinBtn}
        truncateText={isReordering}>
        {isReordering && (
          <View
            style={[a.flex_row, a.gap_md, a.align_center, a.ml_md, a.mr_lg]}>
            <Button
              label={_(msg`Move up`)}
              onPress={onPressUp}
              size="small"
              variant="solid"
              color="secondary"
              style={{height: 36}}>
              <ChevronTop size="md" />
            </Button>
            <Button
              label={_(msg`Move down`)}
              onPress={onPressDown}
              size="small"
              variant="solid"
              color="secondary"
              style={{height: 36}}>
              <ChevronBottom size="md" />
            </Button>
          </View>
        )}
      </ListItem>
    </View>
  )
}
