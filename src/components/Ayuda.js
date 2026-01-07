import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Image } from "react-native";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";

export default function Ayuda({ onBack }) {

    const openLink = (url) => {
        Linking.canOpenURL(url).then(supported => {
            if (supported) {
                Linking.openURL(url);
            } else {
                console.log("Don't know how to open URI: " + url);
            }
        });
    };

    // Funcion de boton volver atras
    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            navigate(-1);
        }
    };

    const contacts = [
        {
            title: "Llamar",
            logo: require('../../assets/telefono.png'),
            link: "tel:+5492227676612",
        },
        {
            title: "WhatsApp",
            logo: require('../../assets/whatsapp.png'),
            link: "http://api.whatsapp.com/send?phone=5492227676612",
        },
        {
            title: "E-mail",
            logo: require('../../assets/email.png'),
            link: "mailto:infofarmerin@gmail.com",
        },
    ];

    const social = [
        {
            title: "YouTube",
            logo: require('../../assets/yt.png'),
            link: "https://www.youtube.com/channel/UCPG5tI4805MPm6jshejr5vA"
        },
        {
            title: "Facebook",
            logo: require('../../assets/facebookicono.png'),
            link: "https://www.facebook.com/farmerinarg"
        },
        {
            title: "Instagram",
            logo: require('../../assets/instagramicono.png'),
            link: "https://www.instagram.com/farmerinar/"
        }
    ];

    return (
        <View style={styles.container}>

            {/* 1. Apartado de Titulo */}
            <Text style={styles.headerTitle}>Ayuda</Text>

            {/* 2. Boton de Volver */}
            <TouchableOpacity onPress={handleBack} style={styles.fullWidthBackButton}>
                <Ionicons name="arrow-back" size={20} color="#297eba" style={{ marginRight: 8 }} />
                <Text style={styles.backButtonText}>Atras</Text>
            </TouchableOpacity>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.sectionHeader}>Contacto</Text>
                <View style={styles.card}>
                    {contacts.map((contact, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[styles.item, index < contacts.length - 1 && styles.borderBottom]}
                            onPress={() => openLink(contact.link)}
                        >
                            <Image source={contact.logo} style={styles.logo} resizeMode="contain" />
                            <View style={styles.info}>
                                <Text style={styles.itemTitle}>{contact.title}</Text>
                            </View>
                            <Text style={styles.arrow}>›</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.sectionHeader}>Redes Sociales</Text>
                <View style={styles.card}>
                    {social.map((s, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[styles.item, index < social.length - 1 && styles.borderBottom]}
                            onPress={() => openLink(s.link)}
                        >
                            <Image source={s.logo} style={styles.logo} resizeMode="contain" />
                            <View style={styles.info}>
                                <Text style={styles.itemTitle}>{s.title}</Text>
                            </View>
                            <Text style={styles.arrow}>›</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.footerContainer}>
                    <Image
                        source={require('../../assets/logolargo2.png')}
                        style={styles.footerLogo}
                        resizeMode="contain"
                    />
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f4f4f9",
        paddingTop: 45 // Ajuste de zona segura superior
    },
    navBar: {
        paddingHorizontal: 20,
        marginBottom: 10,
        alignItems: 'flex-start'
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 20,
        backgroundColor: '#4db14f',
        padding: 10,
        borderWidth: 1,
        borderColor: 'black',
        borderRadius: 15,
        overflow: 'hidden',
        color: '#fff',
        textShadowColor: 'rgba(0, 0, 0, 0.25)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 1,
        marginHorizontal: 20
    },
    content: {
        padding: 20
    },
    sectionHeader: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#888',
        marginBottom: 10,
        marginTop: 10,
        textTransform: 'uppercase'
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 15,
        marginBottom: 20,
        elevation: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
    },
    borderBottom: {
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    logo: {
        width: 30,
        height: 30,
        marginRight: 15,
    },
    info: {
        flex: 1
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333'
    },
    itemValue: {
        fontSize: 14,
        color: '#666',
        marginTop: 2
    },
    arrow: {
        fontSize: 20,
        color: '#ccc',
        fontWeight: 'bold'
    },
    footerContainer: {
        alignItems: 'center',
        marginTop: -50,
        marginBottom: 70
    },
    footerLogo: {
        width: 250,
        height: 255,
        opacity: 0.8
    },
    fullWidthBackButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center', // Centrar texto
        backgroundColor: '#fff',
        paddingVertical: 12,
        marginHorizontal: 20,
        marginBottom: 15,
        borderRadius: 10,
        elevation: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    backButtonText: {
        color: "#297eba",
        fontWeight: "600",
        fontSize: 16,
    },
});
