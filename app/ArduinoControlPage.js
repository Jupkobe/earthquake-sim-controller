import React, { useState } from "react";
import { View, Button, Alert } from "react-native";
import { Bluetooth } from "expo";

const ArduinoControlPage = () => {
  const [connectedDevice, setConnectedDevice] = useState(null);

  const scanForDevices = async () => {
    try {
      const { devices } = await Bluetooth.requestDeviceScan({
        services: ["<service_UUID>"],
      }); // Replace '<service_UUID>' with the UUID of your Arduino's BLE service
      const arduinoDevice = devices.find((device) => device.name === "Arduino"); // Replace 'Arduino' with your Arduino's name
      if (!arduinoDevice) {
        Alert.alert(
          "Arduino not found",
          "Make sure your Arduino is discoverable."
        );
        return;
      }
      setConnectedDevice(arduinoDevice);
      Alert.alert("Arduino found", `Found Arduino: ${arduinoDevice.name}`);
    } catch (error) {
      console.error("Error scanning for devices", error);
      Alert.alert("Scan failed", "Failed to scan for devices.");
    }
  };

  const connectToDevice = async () => {
    if (!connectedDevice) {
      Alert.alert(
        "Device not selected",
        "Please scan and select the Arduino device first."
      );
      return;
    }

    try {
      await Bluetooth.connectToDevice(connectedDevice);
      Alert.alert("Connected to Arduino", "You can now send messages.");
    } catch (error) {
      console.error("Error connecting to device", error);
      Alert.alert("Connection failed", "Failed to connect to Arduino.");
    }
  };

  const sendMessageToArduino = async () => {
    if (!connectedDevice) {
      Alert.alert(
        "Device not selected",
        "Please scan and select the Arduino device first."
      );
      return;
    }

    // Send message to Arduino
    // Example: Implement Bluetooth characteristics read/write operations
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <View style={{ marginTop: 20 }}>
        <Button title="Scan for Devices" onPress={scanForDevices} />
      </View>
      <View style={{ marginTop: 20 }}>
        <Button title="Connect to Device" onPress={connectToDevice} />
      </View>
      <View style={{ marginTop: 20 }}>
        <Button
          title="Send Message to Arduino"
          onPress={sendMessageToArduino}
        />
      </View>
    </View>
  );
};

export default ArduinoControlPage;
