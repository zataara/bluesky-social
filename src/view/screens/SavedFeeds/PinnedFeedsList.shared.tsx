import React from 'react'
import {Pressable, View} from 'react-native'
import {useLingui} from '@lingui/react'
import {msg} from '@lingui/macro'

import * as Toast from 'view/com/util/Toast'
import {useTheme, atoms as a} from '#/alf'
import {
  usePinFeedMutation,
  useSetSaveFeedsMutation,
  useUnpinFeedMutation,
} from '#/state/queries/preferences'
import {Haptics} from '#/lib/haptics'
import {logger} from '#/logger'
import {FeedSourceCard} from '#/view/com/feeds/FeedSourceCard'
import {
  Pin_Filled_Stroke2_Corner0_Rounded as PinFilled,
  Pin_Stroke2_Corner0_Rounded as PinOutlined,
} from '#/components/icons/Pin'
import {Text} from '#/components/Typography'
import {Button} from '#/components/Button'

export function ListItem({
  feedUri,
  isPinned,
  resetSaveFeedsMutationState,
  showSaveBtn = true,
  showPinBtn,
  children,
  truncateText,
}: {
  feedUri: string // uri
  isPinned: boolean
  resetSaveFeedsMutationState: ReturnType<
    typeof useSetSaveFeedsMutation
  >['reset']
  showSaveBtn?: boolean
  showPinBtn?: boolean
  children?: React.ReactNode
  truncateText?: boolean
}) {
  const t = useTheme()
  const {_} = useLingui()
  const {isPending: isPinPending, mutateAsync: pinFeed} = usePinFeedMutation()
  const {isPending: isUnpinPending, mutateAsync: unpinFeed} =
    useUnpinFeedMutation()
  const isPending = isPinPending || isUnpinPending

  const onTogglePinned = React.useCallback(async () => {
    Haptics.default()

    try {
      resetSaveFeedsMutationState()

      if (isPinned) {
        await unpinFeed({uri: feedUri})
      } else {
        await pinFeed({uri: feedUri})
      }
    } catch (e) {
      Toast.show(_(msg`There was an issue contacting the server`))
      logger.error('Failed to toggle pinned feed', {message: e})
    }
  }, [feedUri, isPinned, pinFeed, unpinFeed, resetSaveFeedsMutationState, _])

  return (
    <Pressable
      accessibilityRole="button"
      style={[
        a.flex_row,
        a.align_center,
        a.border_b,
        t.atoms.border_contrast_medium,
        showPinBtn && a.pr_lg,
      ]}>
      <FeedSourceCard
        key={feedUri}
        feedUri={feedUri}
        style={a.border_t_0}
        showSaveBtn={showSaveBtn}
        showMinimalPlaceholder
        truncateText={truncateText}
      />

      {showPinBtn && (
        <Button
          label={isPinned ? _(msg`Unpin`) : _(msg`Pin`)}
          disabled={isPending}
          onPress={onTogglePinned}
          shape="round"
          size="tiny"
          variant="ghost"
          style={[{height: 36, width: 36}]}>
          {isPinned ? (
            <PinFilled size="md" />
          ) : (
            <PinOutlined size="md" fill={t.palette.contrast_500} />
          )}
        </Button>
      )}
      {children}
    </Pressable>
  )
}

export function SectionTitle({
  children,
  button,
}: {
  children: React.ReactNode
  button?: React.ReactNode
}) {
  const t = useTheme()
  return (
    <View
      style={[
        a.border_b,
        a.px_lg,
        a.pt_xl,
        a.pb_md,
        t.atoms.border_contrast_low,
        a.flex_1,
        a.flex_row,
        a.align_center,
        a.justify_between,
      ]}>
      <Text style={[a.text_xl, t.atoms.text]}>{children}</Text>
      {button}
    </View>
  )
}
