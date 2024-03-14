import React from 'react'
import {useTheme, atoms as a} from '#/alf'
import {StyleProp, View, ViewStyle} from 'react-native'
import {Text} from './Typography'

export function EmptyState({
  children,
  wrapWithText = true,
  style,
}: {
  children: React.ReactNode
  wrapWithText?: boolean
  style?: StyleProp<ViewStyle>
}) {
  const t = useTheme()
  return (
    <View
      style={[
        a.flex_1,
        a.py_lg,
        a.px_md,
        a.rounded_sm,
        t.atoms.bg_contrast_25,
        style,
      ]}>
      {wrapWithText ? (
        <Text style={[a.text_md, t.atoms.text_contrast_medium]}>
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  )
}
