import React from "react";
import { NativeRouter, Routes, Route, Navigate } from "react-router-native";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Login from "./src/components/Login";
import Register from "./src/components/Register";
import Home from "./src/components/Home";
import TamboDetalle from "./src/components/TamboDetalle";
import Configuracion from "./src/components/Configuracion";
import { View, StyleSheet } from "react-native";

function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  console.log("PrivateRoute check, currentUser:", currentUser ? "Logged In" : "Not Logged In");
  return currentUser ? children : <Navigate to="/login" />;
}

export default function App() {
  console.log("App component rendering");
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NativeRouter>
        <AuthProvider>
          <View style={styles.container}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/home"
                element={
                  <PrivateRoute>
                    <Home />
                  </PrivateRoute>
                }
              />
              <Route
                path="/tambo/:id"
                element={
                  <PrivateRoute>
                    <TamboDetalle />
                  </PrivateRoute>
                }
              />
              <Route
                path="/configuracion"
                element={
                  <PrivateRoute>
                    <Configuracion />
                  </PrivateRoute>
                }
              />
              <Route path="/" element={<Navigate to="/home" />} />
            </Routes>
          </View>
        </AuthProvider>
      </NativeRouter>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f4f9",
  },
});
