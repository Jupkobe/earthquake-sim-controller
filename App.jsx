import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import {Slider, Icon, Input, Button} from '@rneui/themed';
import {normalizeTo255, normalizeTo0to9, timeLeftMinutes} from './lib/utils';

import React, {useEffect, useRef, useState} from 'react';

import BluetoothSerial from 'react-native-bluetooth-serial';

export default function Workspace() {
  const remainingTime = useRef(0);
  const [pairedDevices, setPairedDevices] = useState([]);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [magnitude, setMagnitude] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [xValue, setXValue] = useState(4);
  const [xTime, setXTime] = useState(0);
  const [yValue, setYValue] = useState(4);
  const [yTime, setYTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    isBluetoothEnabled();
    getPairedDevices();
    BluetoothSerial.on('connectionLost', () => {
      setConnectedDevice(null);
      setIsConnected(false);
      setIsRunning(false);
    });

    return () => BluetoothSerial.write('S');
  }, []);

  useEffect(() => {
    const intervalID = setInterval(getPairedDevices, 2000);

    if (isConnected) clearInterval(intervalID);

    return () => clearInterval(intervalID);
  }, [pairedDevices]);

  useEffect(() => {
    BluetoothSerial.on('bluetoothDisabled', isBluetoothEnabled);

    BluetoothSerial.withDelimiter('\n').then(() => {
      BluetoothSerial.on('read', data => setMagnitude(data.data));
    });
  }, []);

  useEffect(() => {
    let intervalID;
    if (isRunning && !intervalID) {
      intervalID = setInterval(() => {
        remainingTime.current -= 1;
      }, 1000);
    }

    if (!isRunning) clearInterval(intervalID);

    return () => clearInterval(intervalID);
  }, [isRunning]);

  if (remainingTime.current <= 0 && isRunning) setIsRunning(false);

  const isBluetoothEnabled = async () => {
    try {
      const bluetoothState = await BluetoothSerial.isEnabled();
      if (!bluetoothState) {
        setConnectedDevice(null);

        Alert.alert(
          'Bluetooth kapalı',
          'Bluetooth açılsın mı?',
          [
            {
              text: 'Hayır',
              onPress: () => console.log('Cancel Pressed'),
              style: 'cancel',
            },
            {
              text: 'Evet',
              onPress: () => enableBluetoothAndRefresh(),
            },
          ],
          {cancelable: false},
        );
      }
    } catch (e) {
      console.log(e);
    }
  };

  const getPairedDevices = async () => {
    try {
      const pairedDeviceses = await BluetoothSerial.list();
      setPairedDevices(pairedDeviceses);
    } catch (e) {
      console.log(e);
    }
  };

  const enableBluetoothAndRefresh = async () => {
    try {
      BluetoothSerial.enable().then(getPairedDevices);
    } catch (e) {
      console.log(e);
    }
  };

  const connectToDevice = async device => {
    setLoading(true);
    const connectedDeviceId = connectedDevice && connectedDevice.id;
    if (!connecting) {
      if (device.id === connectedDeviceId) {
        alert('Cihaz zaten bağlı');
      } else {
        try {
          setConnecting(true);
          setConnectedDevice(null);

          await BluetoothSerial.connect(device.id);

          ////////////
          setIsConnected(true);
          setLoading(false);
          //////////

          setConnectedDevice(device);
          setConnecting(false);
        } catch (e) {
          console.log(e);
          setConnectedDevice(null);
          setConnecting(false);
          setLoading(false);

          alert('Bu cihaza bağlanılamıyor');
        }
      }
    }
  };

  const disconnectFromDevice = async () => {
    setLoading(true);
    try {
      BluetoothSerial.disconnect().then(() => {
        setConnectedDevice(null);
        setIsConnected(false);
        setLoading(false);
      });
    } catch (err) {
      console.log(err);
      setLoading(false);
    }
  };

  const sendStringToDevice = async str => {
    try {
      await BluetoothSerial.write(str);
    } catch (e) {
      console.log(e);
    }
  };

  const renderItem = ({item}) => (
    <View key={item.id}>
      <Button
        buttonStyle={styles.touchbtn}
        onPress={() => {
          setConnecting(true);
          connectToDevice(item).then(() => {
            setConnecting(false);
          });
        }}>
        <View style={{display: 'flex', alignItems: 'center'}}>
          <Text style={styles.textdevice}>{item.name}</Text>
          <Text style={styles.textDeviceID}>{'id: ' + item.id}</Text>
        </View>
      </Button>
    </View>
  );

  function handleTimeChange(_name, _value) {
    if (_value <= 9999 && _value >= 0) {
      switch (_name) {
        case 'xTime': {
          setXTime(_value);
          break;
        }
        case 'yTime': {
          setYValue(_value);
          break;
        }
      }
    }
  }

  const DeviceList = () => {
    return (
      <View>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            gap: 20,
            paddingHorizontal: 10,
          }}>
          <Text style={{...styles.h3, textAlign: 'center', fontSize: 20}}>
            Eşleştirilmiş Cihazlar
          </Text>
          <Button onPress={getPairedDevices}>Yenile</Button>
        </View>
        {/* <FlatList data={pairedDevices} renderItem={renderItem} /> */}
        {pairedDevices.length > 0 ? (
          <FlatList data={pairedDevices} renderItem={renderItem} />
        ) : (
          <ActivityIndicator size="large" color={'#1869a9'} />
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.body}>
      {loading && (
        <View
          style={{
            ...StyleSheet.absoluteFill,
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            backgroundColor: '#00000088',
          }}>
          <ActivityIndicator size="large" color={'#1869a9'} />
        </View>
      )}
      <View style={styles.main}>
        <View style={styles.title}>
          <Text style={styles.h1}>Deprem Simülatörü</Text>
        </View>

        <View style={styles.inputComponents}>
          {isConnected ? (
            <>
              <View style={styles.twinComponents}>
                <Text style={styles.dalgaTitle}>Yatay Dalgalar</Text>

                <View>
                  <View
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      paddingHorizontal: 10,
                    }}>
                    <Text style={styles.h3}>
                      {'Şiddet: ' + (+xValue).toFixed(1)}
                    </Text>
                    <Slider
                      value={xValue}
                      onValueChange={setXValue}
                      maximumValue={9}
                      minimumValue={4}
                      step={0.1}
                      minimumTrackTintColor="#2590ff"
                      allowTouchTrack
                      trackStyle={{height: 5, backgroundColor: 'transparent'}}
                      thumbStyle={{
                        height: 20,
                        width: 20,
                        backgroundColor: '#2089dc',
                      }}
                    />
                  </View>

                  <View
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      paddingHorizontal: 10,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}>
                    <Text style={styles.h3}>{'Süre (sn): '}</Text>
                    <InputModified
                      value={xTime}
                      handleChange={e => handleTimeChange('xTime', e)}
                    />
                  </View>

                  <View
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      width: '100%',
                      height: '100%',
                      justifyContent: 'space-between',
                      paddingHorizontal: 10,
                    }}>
                    <Button
                      onPress={() => setXTime(300)}
                      style={styles.timeButtons}>
                      5 dk
                    </Button>
                    <Button
                      onPress={() => setXTime(1500)}
                      style={styles.timeButtons}>
                      15 dk
                    </Button>
                    <Button
                      onPress={() => setXTime(1800)}
                      style={styles.timeButtons}>
                      30 dk
                    </Button>
                    <Button
                      onPress={() => setXTime(3600)}
                      style={styles.timeButtons}>
                      1 sa
                    </Button>
                    <Button
                      onPress={() => setXTime(7200)}
                      style={styles.timeButtons}>
                      2 sa
                    </Button>
                  </View>
                </View>
              </View>
              <View style={styles.twinComponents}>
                <Text style={styles.dalgaTitle}>Dikey Dalgalar</Text>

                <View>
                  <View
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      paddingHorizontal: 10,
                    }}>
                    <Text style={styles.h3}>
                      {'Şiddet: ' + (+yValue).toFixed(1)}
                    </Text>
                    <Slider
                      value={yValue}
                      onValueChange={setYValue}
                      maximumValue={9}
                      minimumValue={4}
                      step={0.1}
                      minimumTrackTintColor="#2590ff"
                      allowTouchTrack
                      trackStyle={{height: 5, backgroundColor: 'transparent'}}
                      thumbStyle={{
                        height: 20,
                        width: 20,
                        backgroundColor: '#2089dc',
                      }}
                    />
                  </View>

                  <View
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      paddingHorizontal: 10,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}>
                    <Text style={styles.h3}>{'Süre (sn): '}</Text>
                    <InputModified
                      value={yTime}
                      handleChange={e => handleTimeChange('yTime', e)}
                    />
                  </View>

                  <View
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      width: '100%',
                      height: '100%',
                      justifyContent: 'space-between',
                      paddingHorizontal: 10,
                    }}>
                    <Button
                      onPress={() => setYTime(300)}
                      style={styles.timeButtons}>
                      5 dk
                    </Button>
                    <Button
                      onPress={() => setYTime(1500)}
                      style={styles.timeButtons}>
                      15 dk
                    </Button>
                    <Button
                      onPress={() => setYTime(1800)}
                      style={styles.timeButtons}>
                      30 dk
                    </Button>
                    <Button
                      onPress={() => setYTime(3600)}
                      style={styles.timeButtons}>
                      1 sa
                    </Button>
                    <Button
                      onPress={() => setYTime(7200)}
                      style={styles.timeButtons}>
                      2 sa
                    </Button>
                  </View>
                </View>
              </View>
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: 40,
                }}>
                <Text style={{fontSize: 24, color: '#1869a9'}}>
                  {/* Şiddet Ölçümü: {`${normalizeTo0to9(magnitude)}`} */}
                  Şiddet Ölçümü: {`${magnitude}`}
                </Text>
              </View>

              {isRunning ? (
                <>
                  <View
                    style={{
                      flex: 1,
                      width: '100%',
                      display: 'flex',
                      gap: 12,
                      justifyContent: 'flex-end',
                    }}>
                    <Button
                      onPress={() => {
                        sendStringToDevice('S').then(() => setIsRunning(false));
                        console.log('STOP');
                      }}>
                      {`Bitir (${timeLeftMinutes(remainingTime.current)})`}
                    </Button>
                    <Button
                      disabled={loading}
                      onPress={() => {
                        disconnectFromDevice();
                        console.log('DISCONNECTED');
                      }}>
                      Bağlantıyı Kes
                    </Button>
                  </View>
                </>
              ) : (
                <View
                  style={{
                    flex: 1,
                    width: '100%',
                    display: 'flex',
                    gap: 12,
                    justifyContent: 'flex-end',
                  }}>
                  <Button
                    disabled={loading}
                    onPress={() => {
                      sendStringToDevice(
                        preparedMessage(xTime, xValue, yTime, yValue),
                      ).then(() => {
                        remainingTime.current = Math.max(xTime, yTime);
                        setIsRunning(true);
                      });
                      console.log('START');
                    }}>
                    Başlat
                  </Button>
                  <Button
                    disabled={loading}
                    onPress={() => {
                      disconnectFromDevice();
                      console.log('DISCONNECTED');
                    }}>
                    Bağlantıyı Kes
                  </Button>
                </View>
              )}
            </>
          ) : (
            <DeviceList pairedDevices={pairedDevices} renderItem={renderItem} />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

function InputModified({value, handleChange}) {
  return (
    <Input
      value={value.toString()}
      onChangeText={handleChange}
      errorStyle={{display: 'none'}}
      containerStyle={{flex: 1, display: 'flex', width: '100%'}}
      inputStyle={{color: '#1869a9'}}
      inputContainerStyle={{borderBottomWidth: 0}}
    />
  );
}

const styles = StyleSheet.create({
  loading: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    width: '100%',
    height: '100%',
    backgroundColor: '#fff',
    flex: 1,
    flexDirection: 'column',
    position: 'relative',
  },
  main: {
    width: '100%',
    height: '100%',
  },
  title: {
    width: '100%',
    height: '6%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#2089dc',
  },
  dalgaTitle: {
    fontSize: 20,
    textAlign: 'center',
    fontWeight: '700',
    color: '#1869a9',
  },
  inputComponents: {
    display: 'flex',
    width: '100%',
    height: '94%',
    padding: 16,
    gap: 16,
  },
  twinComponents: {
    height: 250,
    width: '100%',
    padding: 5,
    borderWidth: 1,
    borderRadius: 5,
    gap: 6,
    borderColor: '#2590ff',
  },
  h1: {
    fontSize: 24,
    color: '#1869a9',
  },
  timeButtons: {
    flex: 1,
    borderRadius: 20,
  },
  h3: {fontSize: 16, fontWeight: '500', color: '#1869a9'},
  inputLabelStyle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1869a9',
  },
  touchbtn: {
    height: 60,
    marginTop: 5,
    width: '100%',
    borderWidth: 1,
    borderRadius: 15,
  },
  textdevice: {
    fontSize: 18,
    color: '#fff',
  },
  textDeviceID: {
    color: '#fff',
  },
});

function preparedMessage(xTime, xValue, yTime, yValue) {
  const stringXTime = String(xTime).padStart(4, '0');
  const stringXValue = String(normalizeTo255(xValue)).padStart(3, '0');
  const stringYTime = String(yTime).padStart(4, '0');
  const stringYValue = String(normalizeTo255(yValue)).padStart(3, '0');

  // let message = `x${stringXTime}${stringXValue}y${stringYTime}${stringYValue}`;
  let message =
    'x' + stringXTime + stringXValue + 'y' + stringYTime + stringYValue;

  return message;
}

// #include <SoftwareSerial.h>

// SoftwareSerial bt(7, 6); // RX TX

// void setup() {
//   Serial.begin(9600);
//   bt.begin(9600);
// }

// void loop() {
//   if (bt.available()) {
//     Serial.write(bt.read());
//   }n
//   if (Serial.available()) {
//     bt.write(Serial.read());
//   }
// }
