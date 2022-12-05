import React, {useCallback} from 'react'
import {StyleSheet, View, TouchableOpacity, Alert, Image} from 'react-native'
import Svg, {Circle, Text, Defs, LinearGradient, Stop} from 'react-native-svg'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {
  openCamera,
  openCropper,
  openPicker,
} from 'react-native-image-crop-picker'
import {getGradient} from '../../lib/asset-gen'
import {colors} from '../../lib/styles'

export function UserAvatar({
  isEditable = false,
  size,
  handle,
  displayName,
}: {
  isEditable?: boolean
  size: number
  handle: string
  displayName: string | undefined
}) {
  const initials = getInitials(displayName || handle)
  const gradient = getGradient(handle)

  const handleEditAvatar = useCallback(() => {
    Alert.alert('Select upload method', '', [
      {
        text: 'Take a new photo',
        onPress: () => {
          openCamera({
            mediaType: 'photo',
            cropping: true,
            width: 80,
            height: 80,
            cropperCircleOverlay: true,
          }).then(item => {
            // setLocalAvatarPicture(item.path)
            console.log(item)
          })
        },
      },
      {
        text: 'Select from gallery',
        onPress: () => {
          openPicker({
            mediaType: 'photo',
          }).then(async item => {
            await openCropper({
              mediaType: 'photo',
              path: item.path,
              width: 80,
              height: 80,
              cropperCircleOverlay: true,
            }).then(croppedItem => {
              // setLocalAvatarPicture(croppedItem.path)
              console.log(croppedItem)
            })
          })
        },
      },
    ])
  }, [])

  const renderSvg = (size: number, initials: string) => (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={gradient[0]} stopOpacity="1" />
          <Stop offset="1" stopColor={gradient[1]} stopOpacity="1" />
        </LinearGradient>
      </Defs>
      <Circle cx="50" cy="50" r="50" fill="url(#grad)" />
      <Text
        fill="white"
        fontSize="50"
        fontWeight="bold"
        x="50"
        y="67"
        textAnchor="middle">
        {initials}
      </Text>
    </Svg>
  )

  return isEditable ? (
    <TouchableOpacity onPress={handleEditAvatar}>
      {/* {localAvatarPicture != null ? (
        <Image style={styles.avatarImage} source={{uri: localAvatarPicture}} />
      ) : (
        renderSvg(size, initials)
      )} */}
      {renderSvg(size, initials)}
      <View style={styles.editButtonContainer}>
        <FontAwesomeIcon
          icon="camera"
          size={10}
          style={{color: colors.gray1}}
        />
      </View>
    </TouchableOpacity>
  ) : (
    renderSvg(size, initials)
  )
}

function getInitials(str: string): string {
  const tokens = str
    .toLowerCase()
    .replace(/[^a-z]/g, '')
    .split(' ')
    .filter(Boolean)
    .map(v => v.trim())
  if (tokens.length >= 2 && tokens[0][0] && tokens[0][1]) {
    return tokens[0][0].toUpperCase() + tokens[1][0].toUpperCase()
  }
  if (tokens.length === 1 && tokens[0][0]) {
    return tokens[0][0].toUpperCase()
  }
  return 'X'
}

const styles = StyleSheet.create({
  editButtonContainer: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: colors.gray5,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
})
