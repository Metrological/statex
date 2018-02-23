module.exports = function(grunt) {
    grunt.initConfig({
        concat: {
            'statex' : {
                src : [
                    './src/EventEmitter.js',
                    './lib/Utils.js',
                    './lib/StageUtils.js',
                    './src/Base.js',
                    './src/Stage.js',
                    './src/View.js',
                    './src/ObjectList.js',
                    './src/ViewChildList.js',
                    './lib/structure/Component.js',
                    './lib/structure/Application.js',
                    './lib/structure/StateManager.js',
                    './lib/animation/Animation.js',
                    './lib/animation/AnimationActionItems.js',
                    './lib/animation/AnimationActionSettings.js',
                    './lib/animation/AnimationManager.js',
                    './lib/animation/AnimationSettings.js',
                    './lib/animation/Transition.js',
                    './lib/animation/TransitionManager.js',
                    './lib/animation/TransitionSettings.js'
                ],
                dest : 'statex.js'
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.registerTask('statex', [ 'concat:statex' ]);

};
