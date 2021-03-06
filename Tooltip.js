//  @flow

import * as React from 'react';
import { Text, TouchableOpacity, Modal, View } from 'react-native';
import NativeMethodsMixin from 'react-native/Libraries/Renderer/shims/NativeMethodsMixin';

import Triangle from './Triangle';
import { Colors, ScreenWidth, ScreenHeight, isIOS } from './helpers';
import getTooltipCoordinate from './getTooltipCoordinate';

type State = {
  isVisible: boolean,
  yOffset: number,
  xOffset: number,
  elementWidth: number,
  elementHeight: number,
};

type Props = {
  children: React.Element,
  withPointer: boolean,
  tooltipText?: string,
  tooltipComponent?: React.Element,
  toggleOnPress: boolean, // open tooltip if you press element defaut is false
  tooltipHeight: number, // necessary to calculate positioning.
  tooltipWidth: number, // necessary to calculate positioning.
  tooltipContainerStyle?: any,
  pointerColor?: string,
  tooltipTextStyle?: any,
  onClose?: () => any,
  withOverlay?: boolean, // default true.
  backgroundColor?: string,
  hightlightColor?: string,
  tooltipContainerDefaultStyle?: any,
};

class Tooltip extends React.PureComponent<Props, State> {
  state = {
    isVisible: false,
    yOffset: 0,
    xOffset: 0,
    elementWidth: 0,
    elementHeight: 0,
  };

  static defaultProps = {
    withOverlay: true,
    hightlightColor: 'transparent',
    withPointer: true,
    toggleOnPress: true,
    tooltipHeight: 40,
    tooltipWidth: 150,
    tooltipContainerStyle: {},
    tooltipTextStyle: {},
    backgroundColor: Colors.darkergray,
    onClose: () => {},
  };

  renderedElement: *;

  toggleTooltip = () => {
    const { onClose } = this.props;
    this.setState(prevState => {
      if (prevState.isVisible && !isIOS) {
        onClose && onClose();
      }

      return { isVisible: !prevState.isVisible };
    });
  };

  wrapWithPress = (toggleOnPress: boolean, children: React.Element) => {
    if (toggleOnPress) {
      return (
        <TouchableOpacity onPress={this.toggleTooltip} activeOpacity={1}>
          {children}
        </TouchableOpacity>
      );
    }

    return children;
  };

  getTooltipStyle = (): {} => {
    const { yOffset, xOffset, elementHeight, elementWidth } = this.state;
    const {
      tooltipHeight,
      backgroundColor,
      tooltipWidth,
      tooltipContainerStyle,
      withPointer,
      tooltipContainerDefaultStyle,
    } = this.props;

    const { x, y } = getTooltipCoordinate(
      xOffset,
      yOffset,
      elementWidth,
      elementHeight,
      ScreenWidth,
      ScreenHeight,
      tooltipWidth,
      tooltipHeight,
      withPointer,
    );
    const tooltipDefaultStyle = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      backgroundColor,
      borderRadius: 10,
      padding: 10,
    };

    const defaultToUse = tooltipContainerDefaultStyle || tooltipDefaultStyle;
    return {
      ...defaultToUse,
      position: 'absolute',
      left: x,
      top: y,
      width: tooltipWidth,
      height: tooltipHeight,
      ...tooltipContainerStyle,
    };
  };

  renderPointer = () => {
    const { yOffset, xOffset, elementHeight, elementWidth } = this.state;
    const { backgroundColor, pointerColor } = this.props;
    const pastMiddleLine = yOffset > ScreenHeight / 2;

    return (
      <View
        style={{
          position: 'absolute',
          top: pastMiddleLine ? yOffset - 13 : yOffset + elementHeight - 2,
          left: xOffset + elementWidth / 2 - 7.5,
        }}
      >
        <Triangle
          style={{ borderBottomColor: pointerColor || backgroundColor }}
          isDown={pastMiddleLine}
        />
      </View>
    );
  };
  renderContent = (withTooltip: boolean) => {
    const {
      tooltipComponent,
      withPointer,
      tooltipText,
      toggleOnPress,
      tooltipTextStyle,
      hightlightColor,
    } = this.props;

    if (!withTooltip)
      return this.wrapWithPress(toggleOnPress, this.props.children);

    const { yOffset, xOffset } = this.state;
    return (
      <React.Fragment>
        <View
          style={{
            position: 'absolute',
            top: yOffset,
            left: xOffset,
            backgroundColor: hightlightColor,
            overflow: 'visible',
          }}
        >
          {this.props.children}
        </View>
        {withPointer && this.renderPointer()}
        <View style={{ ...this.getTooltipStyle() }}>
          {tooltipComponent ? (
            tooltipComponent
          ) : (
            <Text style={tooltipTextStyle}>{tooltipText}</Text>
          )}
        </View>
      </React.Fragment>
    );
  };

  componentDidMount() {
    // wait to compute onLayout values.
    setTimeout(this.getElementPosition, 500);
  }

  getElementPosition = () => {
    if (this.renderedElement) {
      NativeMethodsMixin.measureInWindow.call(
        this.renderedElement,
        (x, y, width, height) => {
          this.setState({
            xOffset: x,
            yOffset: y,
            elementWidth: width,
            elementHeight: height,
          });
        },
      );
    }
  };

  render() {
    const { isVisible } = this.state;
    const { onClose, withOverlay } = this.props;

    return (
      <View collapsable={false} ref={e => (this.renderedElement = e)}>
        {this.renderContent(false)}
        <Modal
          animationType="fade"
          visible={isVisible}
          transparent
          onDismiss={onClose}
          onRequestClose={onClose}
        >
          <TouchableOpacity
            style={styles.container(withOverlay)}
            onPress={this.toggleTooltip}
            activeOpacity={1}
          >
            {this.renderContent(true)}
          </TouchableOpacity>
        </Modal>
      </View>
    );
  }
}

const styles = {
  container: (withOverlay: boolean) => ({
    backgroundColor: withOverlay ? Colors.overlay_bright : 'transparent',
    flex: 1,
  }),
};

export default Tooltip;
