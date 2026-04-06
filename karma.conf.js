module.exports = function(config) {
    config.set({
        frameworks: ['jasmine'],
        files: [
            'src/app/app.component.spec.ts'
        ],
        browsers: ['Chrome'],
        singleRun: true
    });
};