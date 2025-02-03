import * as React from 'react'
import {
  Dimensions,
  NativeSyntheticEvent,
  Platform,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native'
import {
  SafeAreaProvider,
  withSafeAreaInsets,
  WithSafeAreaInsetsProps,
} from 'react-native-safe-area-context'
import {requireNativeModule, requireNativeViewManager} from 'expo-modules-core'

import {BottomSheetState, BottomSheetViewProps} from './BottomSheet.types'
import {BottomSheetPortalProvider} from './BottomSheetPortal'
import {Context as PortalContext} from './BottomSheetPortal'

const screenHeight = Dimensions.get('screen').height

const NativeView: React.ComponentType<
  BottomSheetViewProps & {
    ref: React.RefObject<any>
    style: StyleProp<ViewStyle>
  }
> = requireNativeViewManager('BottomSheet')

const NativeModule = requireNativeModule('BottomSheet')

const isIOS15 =
  Platform.OS === 'ios' &&
  // semvar - can be 3 segments, so can't use Number(Platform.Version)
  Number(Platform.Version.split('.').at(0)) < 16

type BottomSheetViewState = {
  open: boolean
  viewHeight?: number
}

class BottomSheetNativeComponentInner extends React.Component<
  BottomSheetViewProps & WithSafeAreaInsetsProps,
  BottomSheetViewState
> {
  ref = React.createRef<any>()

  static contextType = PortalContext

  constructor(props: BottomSheetViewProps & WithSafeAreaInsetsProps) {
    super(props)
    this.state = {
      open: false,
    }
  }

  present() {
    this.setState({open: true})
  }

  dismiss() {
    this.ref.current?.dismiss()
  }

  private onStateChange = (
    event: NativeSyntheticEvent<{state: BottomSheetState}>,
  ) => {
    const {state} = event.nativeEvent
    const isOpen = state !== 'closed'
    this.setState({open: isOpen})
    this.props.onStateChange?.(event)
  }

  private updateLayout = () => {
    this.ref.current?.updateLayout()
  }

  static dismissAll = async () => {
    await NativeModule.dismissAll()
  }

  render() {
    const Portal = this.context as React.ContextType<typeof PortalContext>
    if (!Portal) {
      throw new Error(
        'BottomSheet: You need to wrap your component tree with a <BottomSheetPortalProvider> to use the bottom sheet.',
      )
    }

    if (!this.state.open) {
      return null
    }

    const {children, backgroundColor, ...rest} = this.props
    const cornerRadius = rest.cornerRadius ?? 0

    const adjustedScreenHeight = screenHeight - this.props.insets.top

    let extraStyles
    if (isIOS15 && this.state.viewHeight) {
      const {viewHeight} = this.state
      if (viewHeight < screenHeight / 2) {
        extraStyles = {
          height: viewHeight,
          marginTop: screenHeight / 2 - viewHeight,
          borderTopLeftRadius: cornerRadius,
          borderTopRightRadius: cornerRadius,
        }
      }
    }

    return (
      <Portal>
        <NativeView
          {...rest}
          onStateChange={this.onStateChange}
          ref={this.ref}
          style={{
            position: 'absolute',
            height: adjustedScreenHeight,
            width: '100%',
          }}
          containerBackgroundColor={backgroundColor}>
          <SafeAreaProvider
            style={[
              {backgroundColor},
              Platform.OS === 'android' && {
                borderTopLeftRadius: cornerRadius,
                borderTopRightRadius: cornerRadius,
              },
              extraStyles,
            ]}>
            <View
              onLayout={e => {
                const {height} = e.nativeEvent.layout
                this.setState({viewHeight: height})
                this.updateLayout()
              }}>
              <BottomSheetPortalProvider>{children}</BottomSheetPortalProvider>
            </View>
          </SafeAreaProvider>
        </NativeView>
      </Portal>
    )
  }
}

export type BottomSheetNativeComponent =
  React.ComponentType<BottomSheetViewProps> & {
    present: () => void
    dismiss: () => void
  }
export const BottomSheetNativeComponent = withSafeAreaInsets(
  BottomSheetNativeComponentInner,
)
