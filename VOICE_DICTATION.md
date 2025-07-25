# Voice Dictation Feature

## Overview

The Nesta Education Platform now includes voice dictation functionality that allows students to speak their questions directly to the AI tutor using their device's microphone. This feature enhances accessibility and provides a more natural interaction method.

## How to Use

### Basic Usage

1. **Navigate to the Tutor Interface**: Go to `/student/tutor` in the application
2. **Click the Dictate Button**: Look for the microphone icon button to the left of the "Upload Image" button
3. **Grant Microphone Permission**: When prompted, allow microphone access
4. **Speak Your Question**: Clearly articulate your question or statement
5. **Review and Edit**: The transcribed text will appear in the text area where you can edit it if needed
6. **Send**: Press Enter or click the Enter button to send your message

### Visual Indicators

- **Recording State**: The button changes to show a "Stop" icon when recording
- **Text Area**: The input area gets a red border and background when recording
- **Recording Indicator**: A pulsing red dot and "Recording..." text appears in the top-left of the text area
- **Placeholder Text**: Changes to "Listening... Speak now..." during recording

### Keyboard Shortcut

- **Ctrl+Shift+M** (Windows/Linux) or **Cmd+Shift+M** (Mac): Toggle voice recording on/off

## Browser Compatibility

### Supported Browsers
- ✅ Chrome (recommended)
- ✅ Edge
- ✅ Safari
- ✅ Firefox (limited support)

### Requirements
- Modern browser with Web Speech API support
- Microphone access permission
- HTTPS connection (required for microphone access in most browsers)

## Troubleshooting

### Common Issues

1. **"Voice Recording Not Supported"**
   - Use a modern browser like Chrome, Edge, or Safari
   - Ensure you're on HTTPS (required for microphone access)

2. **"Microphone Access Required"**
   - Click "Allow" when the browser asks for microphone permission
   - Check your browser's microphone settings
   - Ensure no other applications are using the microphone

3. **Poor Transcription Quality**
   - Speak clearly and at a normal pace
   - Reduce background noise
   - Ensure the microphone is working properly
   - Try moving closer to the microphone

4. **Recording Stops Unexpectedly**
   - Check if another application is requesting microphone access
   - Ensure the browser tab remains active
   - Check for system-level microphone permissions

### Technical Details

- **API Used**: Web Speech API (webkitSpeechRecognition)
- **Language**: English (en-US)
- **Continuous Mode**: Enabled for longer dictation sessions
- **Interim Results**: Shows partial transcriptions in real-time

## Accessibility Features

- **Keyboard Navigation**: Full keyboard support with Ctrl+Shift+M shortcut
- **Visual Feedback**: Clear visual indicators for recording state
- **Screen Reader Support**: Compatible with screen readers
- **Error Handling**: Clear error messages for unsupported browsers or permission issues

## Privacy and Security

- **Local Processing**: Voice recognition happens locally in the browser
- **No Server Storage**: Audio is not stored or transmitted to servers
- **Permission Required**: Explicit user consent required for microphone access
- **Secure Connection**: Requires HTTPS for microphone access

## Future Enhancements

Potential improvements for future versions:
- Support for additional languages
- Custom vocabulary for educational terms
- Voice command shortcuts
- Integration with accessibility tools
- Offline voice recognition capabilities 