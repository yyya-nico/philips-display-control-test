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
                            const inputSourceInfo = grepInfo('OP_60_InputSource');
                            inputSource.value = inputSourceInfo.current.value;

                            if (!initComplete) {
                                const luminanceInfo = grepInfo('OP_10_Luminance');
                                range.value = luminanceInfo.current.value;

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
    systemStart: () =>
        invokeWrapper('start'),
    rescan: () =>
        invokeWrapper('Rescan'),
    getDisplayData: () =>
        invokeWrapper('GetDisplayData'),
    getGameSyncData: () =>
        invokeWrapper('GetGameSyncData2'),
    setMontiorMode: (value) =>
        invokeWrapper('SetMonitorMode', value),
    checkUpstreamCable: () =>
        invokeWrapper('CheckUpstreamCable'),
    getMonitorConnectedCount: () =>
        invokeWrapper('GetMonitorCount'),
    getFirmwareData: () =>
        invokeWrapper('GetDeviceList'),
    installDriver: (type, path) =>
        invokeWrapper('InstallDriver', type, path),
    updateFirmware: (modelName, deviceType, binPath) =>
        invokeWrapper('UpdateFirmware', modelName, deviceType, binPath),
    /** ======================= remote control ======================= */
    getDeviceBodyData: () =>
        invokeWrapper('GetRemoteControlDeviceBodyData'),
    getSupportData: () =>
        invokeWrapper('GetRemoteControlSupportData'),
    getConfigData: () =>
        invokeWrapper('GetRemoteControlConfigData'),
    setOsdBatch: (data) =>
        invokeWrapper('SetOSDs', data),
    /** ======================= picture ======================= */
    setPictureFormat: (value) =>
        invokeWrapper('SetOSD', 'OP_86_DisplayScaling', value),
    setBrightness: (value) =>
        invokeWrapper('SetOSD', 'OP_10_Luminance', value),
    setContrast: (value) =>
        invokeWrapper('SetOSD', 'OP_12_Contrast', value),
    setResolutionNotify: (value) =>
        invokeWrapper('SetOSD', 'OP_E9_ResolutionNotifier', value),
    setResolution: (value) =>
        invokeWrapper('SetResolution', value),
    setInputSource: (value) =>
        invokeWrapper('InputsourceChange', value, -1),
    setInputSourceAutoEnable: (value) =>
        invokeWrapper('SetOSD', 'OP_ED_InputAuto', value ? 1 : 0),
    setPIPPBP: (data) =>
        invokeWrapper('SetPIPPBP', data),
    swapPippbp: () =>
        invokeWrapper('PIPPBPSwap'),
    /** ======================= color ======================= */
    setColorTemperature: (value) =>
        invokeWrapper('SetOSD', 'OP_14_SelectColorPreset', value),
    setColorTemperatureRed: (value) =>
        invokeWrapper('SetOSD', 'OP_16_VideoGainDriveRed', value),
    setColorTemperatureGreen: (value) =>
        invokeWrapper('SetOSD', 'OP_18_VideoGainDriveGreen', value),
    setColorTemperatureBlue: (value) =>
        invokeWrapper('SetOSD', 'OP_1A_VideoGainDriveBlue', value),
    setBlackLevel: (value) =>
        invokeWrapper('SetOSD', 'OP_92_TVBlackLevelLuminance', value),
    setGamma: (value) =>
        invokeWrapper('SetOSD', 'OP_72_Gamma', value),
    setSamrtImage: (value) =>
        invokeWrapper('SetOSD', 'OP_DC_DisplayApplication', value),
    gameSyncStart: (value) =>
        invokeWrapper('GameSyncStart', value ? 1 : 0),
    processGameSyncStart: (processName) =>
        invokeWrapper('GameModeStart', processName),
    setProcessGameSync: (path, mode = -1) =>
        invokeWrapper('GameModeSet2', path, mode),
    removeProcessGameSync: (path) =>
        invokeWrapper('GameSyncRemove2', path),
    /** ======================= setting ======================= */
    monitorChange: (name) =>
        invokeWrapper('MonitorChange', name),
    setAudioMute: (value) =>
        invokeWrapper('SetOSD', 'OP_8D_AudioMute', value),
    setAudio: (value) =>
        invokeWrapper('SetOSD', 'OP_62_AudioSpeakerVolume', value),
    readOSD: () =>
        invokeWrapper('ReadOSD', 'OP_AA_ScreenOrientation'),
    setOrientation: (value) =>
        invokeWrapper('SetOrientation', value),
    restoreFactoryDefaults: (displayName) =>
        invokeWrapper('RestoreFactoryDefaults', displayName),
    /** ======================= power ======================= */
    setEcoMode: (data) =>
        invokeWrapper('SetECOModeData', data),
    setActivationTimer: (isActive) =>
        invokeWrapper('SetActivationTimer', isActive ? 1 : 0),
    setStandbyTimer: (value) =>
        invokeWrapper('SetStandbyTimer', value),
    setShutdownTimer: (value) =>
        invokeWrapper('SetShutdownTimer', value),
    setActivationShutdown: (isActive) =>
        invokeWrapper('SetActivationShutdown', isActive ? 1 : 0),
    setHourMinute: (value) =>
        invokeWrapper('SetHourMinute', value),
    setDayOfWeeks: (days) =>
        invokeWrapper('SetDayOfWeeks', JSON.stringify(days)),
    standby: () =>
        invokeWrapper('ImmediateStandby'),
    powerOff: () =>
        invokeWrapper('ImmediatePowerOff'),
    setPowerLed: (value) =>
        invokeWrapper('SetOSD', 'OP_F2_PowerLED', value),
    /** ======================= other ======================= */
    setOsdLanguage: (value) =>
        invokeWrapper('SetOSD', 'OP_CC_OSDLanguage', value),
    splitScreenInit: () =>
        invokeWrapper('SplitScreenIni'),
    getSplitScreenData: () =>
        invokeWrapper('GetSplitScreenId'),
    setSplitScreen: (displayName, value) =>
        invokeWrapper('SetSplitScreen', displayName, value),
    splitScreenExit: () =>
        invokeWrapper('ExitScreen'),
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