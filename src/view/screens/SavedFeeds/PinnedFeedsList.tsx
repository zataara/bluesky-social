import React, {useEffect, useState} from 'react'
import {Trans, msg} from '@lingui/macro'
import {Button, ButtonText} from '#/components/Button'
import {useLingui} from '@lingui/react'
import {LayoutAnimation, View} from 'react-native'

import {useSetSaveFeedsMutation} from '#/state/queries/preferences'
import {ListItem, SectionTitle} from './PinnedFeedsListItem'
import {atoms as a} from '#/alf'
import {
  ChevronBottom_Stroke2_Corner0_Rounded as ChevronBottom,
  ChevronTop_Stroke2_Corner0_Rounded as ChevronTop,
} from '#/components/icons/Chevron'
import {track} from '#/lib/analytics/analytics'
import {logger} from '#/logger'
import * as Toast from '#/view/com/util/Toast'
import {useMutation} from '@tanstack/react-query'

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
  // local state for reordering
  const [localFeeds, setLocalFeeds] = useState(currentFeeds.pinned)
  const [isReordering, setIsReordering] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  useEffect(() => {
    if (!isDirty) {
      if (localFeeds.join() !== currentFeeds.pinned.join()) {
        setIsDirty(true)
      }
    }
  }, [currentFeeds.pinned, isDirty, localFeeds])

  useEffect(() => {
    if (!isReordering) {
      setLocalFeeds(currentFeeds.pinned)
    }
  }, [isReordering, currentFeeds.pinned])

  const {mutate: onSave, isPending: isSaving} = useMutation({
    mutationFn: async () => {
      if (!isDirty) return

      await setSavedFeeds({saved: currentFeeds.saved, pinned: localFeeds})
    },
    onError: err => {
      Toast.show(_(msg`There was an issue contacting the server`))
      logger.error('Failed to save reordered pinned feeds', {message: err})
    },
    onSuccess: () => {
      setIsReordering(false)
      setIsDirty(false)
      Toast.show(_(msg`Saved!`))
    },
  })

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
            color={isDirty ? 'primary' : 'secondary'}
            disabled={isSaving}
            variant="solid"
            onPress={() => {
              LayoutAnimation.configureNext(
                LayoutAnimation.Presets.easeInEaseOut,
              )
              if (isReordering && isDirty) {
                onSave()
              } else {
                setIsReordering(r => !r)
              }
            }}>
            <ButtonText>
              {isReordering ? (
                isDirty ? (
                  <Trans>Save</Trans>
                ) : (
                  <Trans>Done</Trans>
                )
              ) : (
                <Trans>Reorder</Trans>
              )}
            </ButtonText>
          </Button>
        }>
        <Trans>Pinned Feeds</Trans>
      </SectionTitle>
      {localFeeds.map(uri => (
        <SortableListItem
          key={uri}
          feedUri={uri}
          resetSaveFeedsMutationState={resetSaveFeedsMutationState}
          isReordering={isReordering}
          showPinBtn={showPinBtn}
          feeds={localFeeds}
          setFeedOrder={setLocalFeeds}
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
  feeds,
  setFeedOrder,
}: {
  feedUri: string
  resetSaveFeedsMutationState: () => void
  isReordering: boolean
  showPinBtn?: boolean
  feeds: string[]
  setFeedOrder: (feeds: string[]) => void
}) {
  const {_} = useLingui()

  const onPressUp = React.useCallback(async () => {
    // create new array, do not mutate
    const pinned = [...feeds]
    const index = pinned.indexOf(feedUri)

    if (index === -1 || index === 0) return
    ;[pinned[index], pinned[index - 1]] = [pinned[index - 1], pinned[index]]

    try {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
      setFeedOrder(pinned)
      track('CustomFeed:Reorder', {
        uri: feedUri,
        index: pinned.indexOf(feedUri),
      })
    } catch (e) {
      Toast.show(_(msg`There was an issue contacting the server`))
      logger.error('Failed to set pinned feed order', {message: e})
    }
  }, [feedUri, setFeedOrder, feeds, _])

  const onPressDown = React.useCallback(async () => {
    const pinned = [...feeds]
    const index = pinned.indexOf(feedUri)

    if (index === -1 || index >= pinned.length - 1) return
    ;[pinned[index], pinned[index + 1]] = [pinned[index + 1], pinned[index]]

    try {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
      setFeedOrder(pinned)
      track('CustomFeed:Reorder', {
        uri: feedUri,
        index: pinned.indexOf(feedUri),
      })
    } catch (e) {
      Toast.show(_(msg`There was an issue contacting the server`))
      logger.error('Failed to set pinned feed order', {message: e})
    }
  }, [feedUri, setFeedOrder, feeds, _])

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
