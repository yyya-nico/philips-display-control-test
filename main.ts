import * as signalR from '@microsoft/signalr'
import './style.scss'

const connection = new signalR.HubConnectionBuilder()
    .withUrl("http://localhost:10000/SmartControlHub", {
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets
    })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Information)
    .build();

async function start() {
    try {
        await connection.start();
        list.systemStart();
        console.log("SignalR Connected.");
    } catch (err) {
        console.log(err);
        setTimeout(start, 5000);
    }
};

connection.onclose(async () => {
    formWrapper.disabled = true;
    await start();
});

// Start the connection.
start();

const controllerForm = document.forms['controller'] as HTMLFormElement;
const formWrapper = controllerForm['wrapper'] as HTMLFieldSetElement;
const funcs = controllerForm['funcs'] as HTMLSelectElement;
const range = controllerForm['range'] as HTMLInputElement;
const inputSource = controllerForm['input-source'] as HTMLSelectElement;
const output = controllerForm['output'] as HTMLOutputElement;

const portals = [
    'DisplayData',
    'GameSyncData',
    'OSDAttributeData',
    'SystemData',
    'ECOModeData',
    'PackageMessageData',
    'PIPPBPData',
    'SplitScreenIni',
    'GetSplitScreenId',
    'ExitScreen',
    'RemoteControlDeviceBodyData',
    'RemoteControlSupportData',
    'RemoteControlConfigData',
    'FirmwareUpdateProgressData',
    'FirmwareData',
    'AutoSourceEnable',
    'GetFancyZonesVersion',
    'StartFancyZonesEditor',
    'EnableFancyZones',
    'GameSyncData2',
    'UpdateFirmware',
    'FancyZonesData',
    'NotifyPIPPBPData',
    'CheckUpstreamCable',
    'GetMonitorCount',
    'GetDeviceList',
    'InstallDriver'
];

const NAME_TO_OPTION = {
    Normal__DisplayPort1: 'DP1',
    Normal__DisplayPort2: 'DP2',
    Normal__DigitalHDMI1: 'HDMI1',
    Normal__DigitalHDMI2: 'HDMI2',
    Normal__DigitalHDMI3: 'HDMI3',
    Normal__VGA1: 'VGA1',
    Normal__DSub: 'DSub',
    Normal__DVI: 'DVI',
    Normal__USBC1: 'USBC1',
    Normal__USBC2: 'USBC2'
};

let initComplete = false;

portals.forEach(portal => {
    connection.on(portal, data => {
        const ok = data.err_code === 0 && !data.err_msg;
        if (ok) {
            (tag => {
                const grepInfo = (target: string) => ({
                    current: tag.osdInfo.attributeInfos.find(info => info.evcpOpCode === target) as any,
                    params: tag.osdInfo.ddcHelInfo.supportList.find(ops => ops.name === target).supportChild as any[]
                });
                switch (portal) {
                    case 'DisplayData':
                        (() => {
                            const luminanceInfo = grepInfo('OP_10_Luminance');
                            range.value = luminanceInfo.current.value;

                            const inputSourceInfo = grepInfo('OP_60_InputSource');
                            inputSource.value = inputSourceInfo.current.value;

                            if (!initComplete) {
                                inputSourceInfo.params.forEach(param => {
                                    const option = document.createElement('option');
                                    const optionText = NAME_TO_OPTION[param.name];
                                    option.value = param.value;
                                    option.textContent = optionText;
                                    inputSource.appendChild(option);
                                });
                                formWrapper.disabled = false;
                                initComplete = true;
                            }
                        })();
                    break;
                }
            })(data.tag);
        }
        output.value = JSON.stringify(data);
    });
});

const invokeWrapper = (portal: string, ...args: any[]) => {
    const uuid = crypto.randomUUID();
    return connection.invoke(portal, uuid, ...args);
};

const list = {
    systemStart() {
        return invokeWrapper('start');
    },
    rescan() {
        return invokeWrapper('Rescan');
    },
    getDisplayData() {
        return invokeWrapper('GetDisplayData');
    },
    getGameSyncData() {
        return invokeWrapper('GetGameSyncData2');
    },
    setMontiorMode(value) {
        return invokeWrapper('SetMonitorMode', value);
    },
    checkUpstreamCable() {
        return invokeWrapper('CheckUpstreamCable');
    },
    getMonitorConnectedCount() {
        return invokeWrapper('GetMonitorCount');
    },
    getFirmwareData() {
        return invokeWrapper('GetDeviceList');
    },
    installDriver(type, path) {
        return invokeWrapper('InstallDriver', type, path);
    },
    updateFirmware(modelName, deviceType, binPath) {
        return invokeWrapper('UpdateFirmware', modelName, deviceType, binPath);
    },
    /** ======================= remote control ======================= */
    getDeviceBodyData() {
        return invokeWrapper('GetRemoteControlDeviceBodyData');
    },
    getSupportData() {
        return invokeWrapper('GetRemoteControlSupportData');
    },
    getConfigData() {
        return invokeWrapper('GetRemoteControlConfigData');
    },
    setOsdBatch(data) {
        return invokeWrapper('SetOSDs', data);
    },
    /** ======================= picture ======================= */
    setPictureFormat(value) {
        return invokeWrapper('SetOSD', 'OP_86_DisplayScaling', value);
    },
    setBrightness(value) {
        return invokeWrapper('SetOSD', 'OP_10_Luminance', value);
    },
    setContrast(value) {
        return invokeWrapper('SetOSD', 'OP_12_Contrast', value);
    },
    setResolutionNotify(value) {
        return invokeWrapper('SetOSD', 'OP_E9_ResolutionNotifier', value);
    },
    setResolution(value) {
        return invokeWrapper('SetResolution', value);
    },
    setInputSource(value) {
        return invokeWrapper('InputsourceChange', value, -1);
    },
    setInputSourceAutoEnable(value) {
        return invokeWrapper('SetOSD', 'OP_ED_InputAuto', value ? 1 : 0);
    },
    setPIPPBP(data) {
        return invokeWrapper('SetPIPPBP', data);
    },
    swapPippbp() {
        return invokeWrapper('PIPPBPSwap');
    },
    /** ======================= color ======================= */
    setColorTemperature(value) {
        return invokeWrapper('SetOSD', 'OP_14_SelectColorPreset', value);
    },
    setColorTemperatureRed(value) {
        return invokeWrapper('SetOSD', 'OP_16_VideoGainDriveRed', value);
    },
    setColorTemperatureGreen(value) {
        return invokeWrapper('SetOSD', 'OP_18_VideoGainDriveGreen', value);
    },
    setColorTemperatureBlue(value) {
        return invokeWrapper('SetOSD', 'OP_1A_VideoGainDriveBlue', value);
    },
    setBlackLevel(value) {
        return invokeWrapper('SetOSD', 'OP_92_TVBlackLevelLuminance', value);
    },
    setGamma(value) {
        return invokeWrapper('SetOSD', 'OP_72_Gamma', value);
    },
    setSamrtImage(value) {
        return invokeWrapper('SetOSD', 'OP_DC_DisplayApplication', value);
    },
    gameSyncStart(value) {
        return invokeWrapper('GameSyncStart', value ? 1 : 0);
    },
    processGameSyncStart(processName) {
        return invokeWrapper('GameModeStart', processName);
    },
    setProcessGameSync(path) {
        var mode = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : -1;
        return invokeWrapper('GameModeSet2', path, mode);
    },
    removeProcessGameSync(path) {
        return invokeWrapper('GameSyncRemove2', path);
    },
    /** ======================= setting ======================= */
    monitorChange(name) {
        return invokeWrapper('MonitorChange', name);
    },
    setAudioMute(value) {
        return invokeWrapper('SetOSD', 'OP_8D_AudioMute', value);
    },
    setAudio(value) {
        return invokeWrapper('SetOSD', 'OP_62_AudioSpeakerVolume', value);
    },
    readOSD() {
        return invokeWrapper('ReadOSD', 'OP_AA_ScreenOrientation');
    },
    setOrientation(value) {
        return invokeWrapper('SetOrientation', value);
    },
    restoreFactoryDefaults(displayName) {
        return invokeWrapper('RestoreFactoryDefaults', displayName);
    },
    /** ======================= power ======================= */
    setEcoMode(data) {
        return invokeWrapper('SetECOModeData', data);
    },
    setActivationTimer(isActive) {
        return invokeWrapper('SetActivationTimer', isActive ? 1 : 0);
    },
    setStandbyTimer(value) {
        return invokeWrapper('SetStandbyTimer', value);
    },
    setShutdownTimer(value) {
        return invokeWrapper('SetShutdownTimer', value);
    },
    setActivationShutdown(isActive) {
        return invokeWrapper('SetActivationShutdown', isActive ? 1 : 0);
    },
    setHourMinute(value) {
        return invokeWrapper('SetHourMinute', value);
    },
    setDayOfWeeks(days) {
        return invokeWrapper('SetDayOfWeeks', JSON.stringify(days));
    },
    standby() {
        return invokeWrapper('ImmediateStandby');
    },
    powerOff() {
        return invokeWrapper('ImmediatePowerOff');
    },
    setPowerLed(value) {
        return invokeWrapper('SetOSD', 'OP_F2_PowerLED', value);
    },
    /** ======================= other ======================= */
    setOsdLanguage(value) {
        return invokeWrapper('SetOSD', 'OP_CC_OSDLanguage', value);
    },
    splitScreenInit() {
        return invokeWrapper('SplitScreenIni');
    },
    getSplitScreenData() {
        return invokeWrapper('GetSplitScreenId');
    },
    setSplitScreen(displayName, value) {
        return invokeWrapper('SetSplitScreen', displayName, value);
    },
    splitScreenExit() {
        return invokeWrapper('ExitScreen');
    },
};

controllerForm.addEventListener('submit', e => {
    e.preventDefault();
    const args: any = [];
    if (funcs.value in list) {
        list[funcs.value](...args);
    }
});

range.addEventListener('change', () => {
    list.setBrightness(range.value);
});

inputSource.addEventListener('change', () => {
    list.setInputSource(inputSource.value);
});